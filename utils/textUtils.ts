/**
 * Utility functions for text processing
 */

/**
 * Loại bỏ dấu tiếng Việt và chuyển về chữ thường
 * @param str - Chuỗi cần xử lý
 * @returns Chuỗi không dấu, chữ thường
 * 
 * @example
 * removeVietnameseTones('Trạm Thủ Đức') // 'tram thu duc'
 * removeVietnameseTones('Phường Thuận Giao') // 'phuong thuan giao'
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  
  // Normalize Unicode (NFD) để tách ký tự và dấu
  str = str.normalize('NFD');
  
  // Loại bỏ dấu
  str = str.replace(/[\u0300-\u036f]/g, '');
  
  // Chuyển đổi các ký tự đặc biệt tiếng Việt
  str = str.replace(/đ/g, 'd');
  str = str.replace(/Đ/g, 'D');
  
  // Chuyển về chữ thường
  return str.toLowerCase();
}

/**
 * So sánh 2 chuỗi không phân biệt dấu và hoa thường
 * @param str1 - Chuỗi 1
 * @param str2 - Chuỗi 2
 * @returns true nếu 2 chuỗi giống nhau (không tính dấu và hoa thường)
 */
export function compareIgnoreAccents(str1: string, str2: string): boolean {
  return removeVietnameseTones(str1) === removeVietnameseTones(str2);
}

/**
 * Kiểm tra chuỗi có chứa chuỗi con (không phân biệt dấu và hoa thường)
 * @param text - Chuỗi cần kiểm tra
 * @param search - Chuỗi tìm kiếm
 * @returns true nếu text chứa search (không tính dấu và hoa thường)
 */
export function includesIgnoreAccents(text: string, search: string): boolean {
  return removeVietnameseTones(text).includes(removeVietnameseTones(search));
}

