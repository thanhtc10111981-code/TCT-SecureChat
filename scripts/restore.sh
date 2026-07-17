#!/usr/bin/env bash

# ==============================================================================
# SCRIPT: ALL-IN-ONE POSTGRESQL RESTORE (KHÔI PHỤC TỪ CON SỐ 0)
# Mô tả: Xóa database cũ, tạo mới tinh và khôi phục dữ liệu từ file backup .sql
# Tác giả: AI Assistant
# ==============================================================================

# Thiết lập chế độ dừng khi có lỗi phát sinh
set -eo pipefail

# --- ĐỊNH NGHĨA MÀU SẮC LOG ---
RED='\033;31m'
GREEN='\033;32m'
YELLOW='\033;33m'
BLUE='\033;34m'
NC='\033;0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[WARN] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}" >&2
}

# --- CẤU HÌNH ---
DB_NAME=${DB_NAME:-"dantri_db"}
DB_USER=${DB_USER:-"postgres"}
CONTAINER_SERVICE=${CONTAINER_SERVICE:-"postgres"}

# --- NHẬN THAM SỐ FILE BACKUP ---
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    log_error "Vui lòng cung cấp đường dẫn tới file backup .sql!"
    echo "Sử dụng: $0 <đường_dẫn_file_backup.sql>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Không tìm thấy file backup tại đường dẫn: ${BACKUP_FILE}"
    exit 1
fi

log_warn "CẢNH BÁO CỰC KỲ QUAN TRỌNG:"
log_warn "Script này sẽ XÓA TOÀN BỘ database '${DB_NAME}' hiện tại và khôi phục lại từ đầu."
log_warn "Mọi dữ liệu phát sinh sau thời điểm backup sẽ BỊ MẤT HOÀN TOÀN."
read -p "Bạn có chắc chắn muốn tiếp tục khôi phục? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Hủy bỏ quá trình khôi phục theo yêu cầu của người dùng."
    exit 0
fi

log_info "Bắt đầu quá trình khôi phục DB '${DB_NAME}' từ file: ${BACKUP_FILE}"

# 1. Kiểm tra Docker và container postgres có đang hoạt động
if ! docker compose ps --services --filter "status=running" | grep -q "^${CONTAINER_SERVICE}$"; then
    log_error "Service '${CONTAINER_SERVICE}' không hoạt động hoặc không nằm ở thư mục Docker Compose hiện tại!"
    exit 1
fi

# 2. Ngắt toàn bộ kết nối và Xóa Database cũ (Drop Database)
# Chúng ta phải kết nối vào database mặc định 'postgres' để xóa database khác
log_info "Đang ngắt kết nối và xóa database cũ '${DB_NAME}'..."
docker compose exec -T "$CONTAINER_SERVICE" psql -U "$DB_USER" -d postgres -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = '${DB_NAME}' AND pid <> pg_backend_pid();
" || log_warn "Không thể kết nối hoặc ngắt các session hoạt động cũ (có thể DB chưa được tạo)."

docker compose exec -T "$CONTAINER_SERVICE" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE);" || {
    log_error "Không thể xóa database cũ '${DB_NAME}'!"
    exit 1
}
log_success "Đã xóa thành công database cũ."

# 3. Tạo mới một database rỗng
log_info "Đang tạo mới database rỗng '${DB_NAME}'..."
docker compose exec -T "$CONTAINER_SERVICE" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};" || {
    log_error "Không thể tạo database mới '${DB_NAME}'!"
    exit 1
}
log_success "Đã tạo database mới thành công."

# 4. Khôi phục cấu trúc và dữ liệu từ file backup .sql
log_info "Đang nạp dữ liệu từ file backup vào '${DB_NAME}'..."
if docker compose exec -T "$CONTAINER_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"; then
    log_success "Khôi phục dữ liệu hoàn tất thành công!"
else
    log_error "Có lỗi xảy ra trong quá trình nạp dữ liệu từ file backup!"
    exit 1
fi

# 5. Kiểm tra sơ bộ số lượng bảng sau khi khôi phục
log_info "Kiểm tra sơ bộ số lượng bảng trong database mới..."
TABLES_COUNT=$(docker compose exec -T "$CONTAINER_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "
  SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
")
log_info "Cơ sở dữ liệu hiện tại có: ${TABLES_COUNT} bảng ở schema public."

log_success "=== QUÁ TRÌNH KHÔI PHỤC HOÀN TẤT ==="
