import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư | Passion Coffee",
  description: "Cách ứng dụng Passion Coffee xử lý dữ liệu cá nhân và tiếp nhận yêu cầu của người dùng.",
};

export default function PassionPrivacyPage() {
  return (
    <>
      <h1>Chính sách quyền riêng tư</h1>
      <p>
        Chính sách này áp dụng cho ứng dụng Passion Coffee trên Android
        (vn.unigroups.passion). Dữ liệu được xử lý để vận hành tài khoản, đơn
        hàng, chương trình thành viên và hỗ trợ khách hàng.
      </p>

      <section>
        <h2>Dữ liệu và mục đích sử dụng</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Tên, email, số điện thoại và thông tin xác thực để đăng ký, đăng nhập, khôi phục quyền truy cập và hỗ trợ tài khoản.</li>
          <li>Địa chỉ nhận hàng, chi tiết đơn hàng, lịch sử giao dịch và thông tin thành viên để xử lý đơn, theo dõi thanh toán và áp dụng điểm hoặc ưu đãi.</li>
          <li>Địa chỉ IP để ước tính khu vực và vị trí thiết bị khi bạn cấp quyền, nhằm gợi ý cửa hàng gần bạn.</li>
          <li>Thông tin thiết bị và sự kiện sử dụng do Firebase Analytics ghi nhận để đo lường và cải thiện ứng dụng.</li>
          <li>Thông tin bạn cung cấp khi liên hệ để phản hồi và xử lý yêu cầu hỗ trợ.</li>
        </ul>
      </section>

      <section>
        <h2>Dịch vụ tham gia xử lý dữ liệu</h2>
        <p>
          Google và Firebase hỗ trợ đăng nhập và phân tích sử dụng. GeoJS hỗ
          trợ ước tính khu vực theo IP. Cửa hàng xử lý đơn nhận thông tin cần
          thiết để chuẩn bị hoặc giao hàng. Khi dùng phương thức thanh toán
          qua đối tác, dữ liệu giao dịch cần thiết được chuyển cho đối tác để
          xử lý và đối soát.
        </p>
      </section>

      <section>
        <h2>Bảo vệ, lưu giữ và xóa dữ liệu</h2>
        <p>
          Ứng dụng truyền dữ liệu đến hệ thống qua kết nối HTTPS. Thông tin
          tài khoản được dùng trong thời gian tài khoản còn hoạt động. Hồ sơ
          đơn hàng hoặc giao dịch có thể được giữ theo thời hạn cần thiết
          để đối soát, xử lý tranh chấp, phòng chống gian lận hoặc thực hiện
          nghĩa vụ kế toán và pháp lý. Bạn có thể liên hệ để biết dữ liệu
          nào cần giữ và thời hạn áp dụng cho trường hợp của mình.
        </p>
      </section>

      <section>
        <h2>Quyền của bạn và liên hệ</h2>
        <p>
          Bạn có thể điều chỉnh quyền vị trí trong cài đặt điện thoại, yêu
          cầu truy cập hoặc sửa thông tin qua{" "}
          <a href="mailto:ngoxuanson121@gmail.com">ngoxuanson121@gmail.com</a>,
          hoặc <Link href="/passion/delete-account">gửi yêu cầu xóa tài khoản và dữ liệu</Link>.
        </p>
      </section>
    </>
  );
}
