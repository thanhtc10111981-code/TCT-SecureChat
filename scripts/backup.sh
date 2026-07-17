#!/usr/bin/env bash

# ==============================================================================
# SCRIPT: ALL-IN-ONE POSTGRESQL BACKUP
# Mô tả: Tự động backup cấu trúc và dữ liệu của PostgreSQL chạy trong Docker Compose
# Tác giả: AI Assistant
# ==============================================================================

# Thiết lập chế độ dừng khi có lỗi phát sinh
set -eo pipefail

# --- ĐỊNH NGHĨA MÀU SẮC LOG ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0;0m' # No Color

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
BACKUP_DIR=${BACKUP_DIR:-"/home/jiratest/backups"}
RETENTION_DAYS=${RETENTION_DAYS:-14} # Thời gian lưu trữ file backup (ngày)

# Tạo thư mục lưu trữ nếu chưa có
if [ ! -d "$BACKUP_DIR" ]; then
    log_warn "Thư mục backup '$BACKUP_DIR' chưa tồn tại. Đang tiến hành tạo mới..."
    mkdir -p "$BACKUP_DIR"
    chmod 750 "$BACKUP_DIR"
fi

# Tên file backup định dạng: dantri_db_backup_YYYYMMDD_HHMMSS.sql
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_$(date '+%Y%m%d_%H%M%S').sql"

log_info "Bắt đầu quá trình sao lưu cơ sở dữ liệu: ${DB_NAME}"

# 1. Kiểm tra Docker và Docker Compose có chạy không
if ! command -v docker &> /dev/null; then
    log_error "Không tìm thấy Docker trên hệ thống! Vui lòng cài đặt Docker."
    exit 1
fi

# 2. Kiểm tra container postgres có đang hoạt động hay không
# Tìm file docker-compose.yml bằng cách lùi dần thư mục hoặc chỉ định đúng đường dẫn hoạt động của bạn
# Chạy docker compose ps để xác định xem service có hoạt động không
if ! docker compose ps --services --filter "status=running" | grep -q "^${CONTAINER_SERVICE}$"; then
    log_error "Service '${CONTAINER_SERVICE}' hiện không hoạt động hoặc không được định nghĩa trong Docker Compose!"
    log_info "Mẹo: Hãy di chuyển (cd) vào thư mục chứa file docker-compose.yml trước khi chạy script này."
    exit 1
fi

# 3. Tiến hành backup dữ liệu bằng pg_dump
log_info "Đang chạy pg_dump xuất cấu trúc và dữ liệu..."
# Sử dụng option -T để tắt TTY khi gọi docker compose trong script
if docker compose exec -T "$CONTAINER_SERVICE" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    # Kiểm tra kích thước file backup để đảm bảo không bị rỗng
    FILE_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    log_success "Sao lưu thành công! File lưu tại: ${BACKUP_FILE} (Dung lượng: ${FILE_SIZE})"
else
    log_error "Có lỗi xảy ra khi xuất dữ liệu bằng pg_dump!"
    # Xóa file lỗi rỗng nếu có tạo ra
    [ -f "$BACKUP_FILE" ] && rm -f "$BACKUP_FILE"
    exit 1
fi

# 4. Tự động dọn dẹp các bản backup cũ vượt quá RETENTION_DAYS ngày
log_info "Đang quét và dọn dẹp các file backup cũ hơn ${RETENTION_DAYS} ngày tại '${BACKUP_DIR}'..."
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql" -type f -mtime +"$RETENTION_DAYS" -print -delete | while read -r deleted_file; do
    log_warn "Đã xóa file backup cũ: $(basename "$deleted_file")"
done

log_success "=== QUÁ TRÌNH SAO LƯU HOÀN TẤT ==="
