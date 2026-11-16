import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yêu cầu xóa tài khoản | Passion Coffee",
  description: "Gửi yêu cầu xóa tài khoản và dữ liệu liên quan của ứng dụng Passion Coffee.",
};

const supportEmail = "ngoxuanson121@gmail.com";
const requestSubject = encodeURIComponent("Yêu cầu xóa tài khoản Passion Coffee");

export default function DeletePassionAccountPage() {
  return (
    <>
      <h1>Yêu cầu xóa tài khoản</h1>
      <p>
        Dùng trang này để yêu cầu xóa tài khoản và dữ liệu liên quan của
        ứng dụng Passion Coffee (vn.unigroups.passion).
      </p>

      <section>
        <h2>Cách gửi yêu cầu</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Gửi email đến <a href={`mailto:${supportEmail}?subject=${requestSubject}`}>{supportEmail}</a>{" "}
            với tiêu đề <strong>Yêu cầu xóa tài khoản Passion Coffee</strong>.
          </li>
          <li>
            Ghi email hoặc số điện thoại dùng để đăng ký. Tuyệt đối không gửi
            mật khẩu, mã OTP hoặc số thẻ thanh toán.
          </li>
          <li>
            Phản hồi email từ bộ phận hỗ trợ nếu cần xác minh quyền sở hữu
            tài khoản. Bộ phận hỗ trợ sẽ thông báo kết quả xử lý qua email.
          </li>
        </ol>
      </section>

      <section>
        <h2>Dữ liệu được xử lý khi xóa tài khoản</h2>
        <p>
          Sau khi xác minh, yêu cầu xóa áp dụng cho hồ sơ đăng nhập, thông
          tin liên hệ, địa chỉ đã lưu và dữ liệu thành viên gắn với tài khoản.
          Việc xóa tài khoản chấm dứt quyền truy cập vào điểm và ưu đãi còn lại.
          Hồ sơ đơn hàng hoặc giao dịch cần cho đối soát, tranh chấp, phòng chống
          gian lận hoặc nghĩa vụ pháp lý có thể được giữ trong thời hạn cần thiết.
          Bộ phận hỗ trợ sẽ thông báo dữ liệu cần giữ và thời hạn áp dụng nếu có.
        </p>
      </section>

      <p><Link href="/passion/privacy">Xem chính sách quyền riêng tư</Link></p>
    </>
  );
}
