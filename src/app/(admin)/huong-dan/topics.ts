export const helpTopics: Record<string, { keywords: string; instruction: string }> = {
  "brands": {
    keywords: "thương hiệu brand tạo sửa chuỗi",
    instruction: "Tìm thương hiệu theo tên. Mở chi tiết để kiểm tra thông tin hoặc vào trang tạo khi cần thêm thương hiệu.",
  },
  "invoice-store-management": {
    keywords: "cấu hình hóa đơn cửa hàng xuất hóa đơn vat",
    instruction: "Tìm cửa hàng cần thiết lập. Mở cấu hình hóa đơn của cửa hàng và kiểm tra thông tin trước khi lưu.",
  },
  "invoices": {
    keywords: "tra cứu hóa đơn điện tử vat phát hành bill mã số thuế",
    instruction: "Tìm hóa đơn cần kiểm tra. Đối chiếu cửa hàng, thông tin người mua và trạng thái trước khi xử lý.",
  },
  "invoice-statistics": {
    keywords: "thống kê tổng hợp hóa đơn điện tử vat",
    instruction: "Chọn kỳ và phạm vi cần xem, rồi đối chiếu số tổng hợp với danh sách hóa đơn.",
  },
  "updates": {
    keywords: "phiên bản cập nhật ứng dụng",
    instruction: "Mở danh sách cập nhật để kiểm tra phiên bản và thông tin bản cập nhật.",
  },
  "loyalty": {
    keywords: "thành viên tích điểm loyalty",
    instruction: "Mở Loyalty để tra thông tin chương trình thành viên trong phạm vi quản trị.",
  },
  "special-offers": {
    keywords: "ưu đãi đặc biệt special offers",
    instruction: "Mở ưu đãi cần kiểm tra. Đối chiếu nội dung và hiệu lực, rồi kiểm tra hiển thị trên ứng dụng nếu có thay đổi.",
  },
  "vouchers": {
    keywords: "mã giảm giá coupon voucher tạo kiểm tra",
    instruction: "Tìm mã cần kiểm tra. Đối chiếu hiệu lực và điều kiện sử dụng, rồi kiểm tra mức giảm trên giỏ hàng thử.",
  },
  "sales-dashboard": {
    keywords: "tổng quan doanh thu bán hàng hôm nay",
    instruction: "Chọn kỳ và cửa hàng cần xem. Dùng các báo cáo chi tiết để đối chiếu số tổng.",
  },
  "shift-sales": {
    keywords: "tổng quan doanh thu theo ca hôm nay thu ngân",
    instruction: "Chọn ngày hoặc ca cần xem. Đối chiếu doanh thu với báo cáo ca và số thực nhận.",
  },
  "target-progress": {
    keywords: "kpi target đạt chỉ tiêu mục tiêu doanh thu",
    instruction: "Chọn kỳ cần xem. So số thực hiện với mục tiêu trong cùng phạm vi cửa hàng.",
  },
  "top-store-revenues": {
    keywords: "xếp hạng doanh thu từng cửa hàng chi nhánh",
    instruction: "Chọn kỳ và tìm cửa hàng cần đối chiếu trong bảng doanh thu.",
  },
  "comparison": {
    keywords: "so sánh tăng giảm doanh thu theo kỳ",
    instruction: "Chọn các kỳ cần so sánh. Đọc chênh lệch theo cùng chỉ tiêu và phạm vi.",
  },
  "orders-report": {
    keywords: "đơn theo giờ block 4h số lượng khung giờ",
    instruction: "Chọn kỳ cần xem và kiểm tra nhóm đơn theo khung giờ. Tra mã cụ thể ở Đơn hàng.",
  },
  "products-report": {
    keywords: "món bán chạy số lượng bán sản phẩm",
    instruction: "Chọn kỳ rồi tìm món cần xem. Đối chiếu số lượng bán và doanh thu trên cùng dòng.",
  },
  "material-consumption-report": {
    keywords: "nguyên liệu định mức bom tiêu hao giá vốn vật tư",
    instruction: "Chọn kỳ và cửa hàng. Đối chiếu mã vật tư, đơn vị và lượng tiêu hao với chứng từ cùng phạm vi.",
  },
  "profit-report": {
    keywords: "lợi nhuận chi phí lãi lỗ",
    instruction: "Chọn kỳ và phạm vi. Đối chiếu các khoản doanh thu và chi phí hiển thị trước khi sử dụng số liệu.",
  },
  "profit-forecast": {
    keywords: "dự báo tình hình lợi nhuận",
    instruction: "Chọn kỳ cần xem và kiểm tra các chỉ số dùng trong báo cáo tình hình lợi nhuận.",
  },
  "operations-report": {
    keywords: "vận hành cửa hàng chỉ số hoạt động",
    instruction: "Chọn cửa hàng và kỳ báo cáo. Mở báo cáo theo ngày để xác định thời điểm phát sinh chênh lệch.",
  },
  "daily-operations": {
    keywords: "vận hành ngày nhật ký hoạt động",
    instruction: "Chọn ngày và cửa hàng. Đối chiếu chỉ số của ngày với đơn hàng hoặc ca liên quan.",
  },
  "customer-marketing-report": {
    keywords: "khách hàng marketing tiếp thị báo cáo",
    instruction: "Chọn kỳ, đọc các chỉ số khách hàng và đối chiếu với chương trình đang áp dụng.",
  },
  "weekly-9weeks": {
    keywords: "bảng tuần chín tuần 9 tuần",
    instruction: "Kiểm tra mốc tuần và phạm vi, rồi so từng tuần trên cùng chỉ tiêu.",
  },
  "store-payment-methods": {
    keywords: "đối soát tiền mặt chuyển khoản doanh thu theo phương thức thanh toán",
    instruction: "Chọn kỳ và cửa hàng. So từng phương thức với báo cáo ca và chứng từ thực nhận.",
  },
  "top-up-report": {
    keywords: "nạp thẻ số dư coffee credits báo cáo",
    instruction: "Chọn kỳ và cửa hàng, rồi đối chiếu khoản nạp với chứng từ tại quầy.",
  },
  "feedback-reports": {
    keywords: "phản hồi đánh giá khách hàng csat",
    instruction: "Chọn kỳ cần xem. Khi chuyển một phản hồi cho người phụ trách, ghi lại ngày và cửa hàng liên quan.",
  },
  "orders": {
    keywords: "tìm tra mã đơn bill đơn đã trả tiền thanh toán chờ trạng thái lịch sử",
    instruction: "Tìm theo mã đơn và mở chi tiết. Đối chiếu trạng thái và số tiền với chứng từ. Nếu khách đã trả nhưng đơn còn chờ, ghi mã giao dịch để đối soát trước khi thu lại.",
  },
  "products": {
    keywords: "thêm món tạo sửa sản phẩm menu thức uống topping",
    instruction: "Tìm tên hoặc mã món trước khi tạo. Mở bản ghi cần sửa hoặc trang tạo, chọn danh mục và kiểm tra lại thông tin sau khi lưu.",
  },
  "product-items": {
    keywords: "vật tư hàng hóa hanghoa nguyên liệu mã đơn vị tính",
    instruction: "Tìm mã vật tư cần xem. Đối chiếu tên và đơn vị tính trước khi dùng trong báo cáo tiêu hao.",
  },
  "product-detail-mappings": {
    keywords: "đổi giá sửa giá bán cài giá kích cỡ size",
    instruction: "Tìm đúng món và dòng cấu hình giá. Kiểm tra phạm vi áp dụng trước khi lưu, rồi thử chọn món tại cửa hàng áp dụng để đối chiếu giá.",
  },
  "categories": {
    keywords: "tạo thêm sửa danh mục nhóm món",
    instruction: "Tìm nhóm món trước khi tạo. Mở trang tạo hoặc sửa, nhập thông tin rồi kiểm tra nhóm trong danh sách sau khi lưu.",
  },
  "promotions": {
    keywords: "tạo chương trình khuyến mãi giảm giá",
    instruction: "Mở chương trình và rà hiệu lực, điều kiện và phạm vi. Dùng giỏ hàng thử để kiểm tra mức giảm trước khi áp dụng.",
  },
  "stamp-programs": {
    keywords: "tích stamp tem con dấu thẻ tích",
    instruction: "Mở chương trình cần kiểm tra. Xem điều kiện tích và nhận thưởng, rồi kiểm tra trên tài khoản thử.",
  },
  "loyalty-tiers": {
    keywords: "hạng thành viên đặc quyền tier",
    instruction: "Chọn hạng cần kiểm tra. Đối chiếu quyền lợi và nội dung hiển thị trên ứng dụng bằng tài khoản thuộc hạng đó.",
  },
  "point-rewards": {
    keywords: "đổi điểm quà thưởng tích điểm",
    instruction: "Mở phần thưởng và kiểm tra số điểm, điều kiện và nội dung hiển thị trước khi thử đổi.",
  },
  "home-media": {
    keywords: "đổi banner trang chủ ảnh video mobile ứng dụng",
    instruction: "Mở nội dung trang chủ cần sửa. Lưu nội dung được duyệt, rồi mở ứng dụng đúng thương hiệu để kiểm tra hiển thị.",
  },
  "stores": {
    keywords: "tạo sửa chi nhánh cửa hàng địa chỉ",
    instruction: "Tìm cửa hàng cần cập nhật hoặc mở trang tạo. Kiểm tra thông tin và mở lại bản ghi sau khi lưu.",
  },
  "target-settings": {
    keywords: "cài đặt mục tiêu doanh thu chỉ tiêu kpi target",
    instruction: "Chọn kỳ và phạm vi, nhập mục tiêu rồi kiểm tra ở báo cáo Mục tiêu KPI (Target).",
  },
  "feedback-settings": {
    keywords: "cài đặt cấu hình đánh giá khảo sát phản hồi",
    instruction: "Mở cấu hình, kiểm tra nội dung và trạng thái. Sau khi lưu, kiểm tra luồng đánh giá của khách.",
  },
  "payment-types": {
    keywords: "cài đặt thêm phương thức thanh toán tiền mặt chuyển khoản",
    instruction: "Mở phương thức cần kiểm tra. Đối chiếu tên và cấu hình, rồi kiểm tra các lựa chọn trên POS sau khi lưu.",
  },
  "source-orders": {
    keywords: "cấu hình kênh bán nguồn đơn online",
    instruction: "Mở kênh cần kiểm tra. Đối chiếu tên nguồn trên cấu hình với một đơn từ kênh tương ứng.",
  },
  "cost-categories": {
    keywords: "thiết lập danh mục nhóm chi phí",
    instruction: "Tìm hoặc mở danh mục cần sửa. Kiểm tra tên và thông tin trước khi lưu, rồi mở lại từ danh sách.",
  },
  "pos": {
    keywords: "bán hàng thu ngân tạo đơn mở ca đóng ca giỏ hàng topping thu tiền",
    instruction: "Mở POS, kiểm tra cửa hàng và ca. Chọn món và topping, rà giỏ hàng, chọn phương thức thanh toán rồi kiểm tra kết quả của đơn.",
  },
};

export function topicKey(path: string) {
  return path === "/sales-dashboard" ? "sales-dashboard" : path.split("/").at(-1) ?? "";
}

export function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

const questionWords = new Set(["toi", "muon", "cach", "lam", "sao", "o", "dau", "nhu", "the", "nao", "de", "cho", "co", "gi", "tim", "xem"]);

export function searchScore(query: string, title: string, content: string) {
  if (!query) return 1;

  const name = normalizeSearch(title);
  const text = normalizeSearch(content);
  const words = new Set(`${name} ${text}`.split(" "));
  const terms = [...new Set(query.split(" "))];
  const significantTerms = terms.filter((word) => !questionWords.has(word));
  const searchTerms = significantTerms.length ? significantTerms : terms;
  const matches = searchTerms.filter((word) => words.has(word));
  if (matches.length < Math.ceil(searchTerms.length * 0.6)) return 0;

  const phrase = searchTerms.join(" ");
  const titleWords = new Set(name.split(" "));
  return (matches.length / searchTerms.length) * 10
    + matches.filter((word) => titleWords.has(word)).length
    + (name === phrase ? 12 : name.includes(phrase) ? 6 : 0)
    + (searchTerms.length > 1 && text.includes(phrase) ? 4 : 0);
}

