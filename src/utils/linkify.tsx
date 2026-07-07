import React from 'react';

/**
 * Automatically detects web links in a string and converts them into clickable anchor tags
 * that open in the device's default web browser.
 */
export function linkify(text: string | null | undefined): React.ReactNode {
  if (!text) return '';

  // Regular expression to match URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  if (parts.length === 1) {
    return text;
  }

  return (
    <>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline break-all font-medium transition-colors"
              onClick={(e) => {
                // Prevent bubbling to the parent bubble element (which could trigger edit/delete/reply menus)
                e.stopPropagation();
              }}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}
