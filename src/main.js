import './style.css'
import { renderHeader, renderFooter, setupNav } from './layout.js'

document.querySelector('#app').innerHTML = `
  ${renderHeader('index.html')}

  <main>
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="eyebrow">Sân bóng chất lượng cao · Đặt nhanh trong 2 phút</p>
          <h1>Đặt sân bóng dễ dàng,<br />chơi ngay hôm nay</h1>
          <p class="hero-desc">
            Chọn sân 5, 7 hay 11 người theo ý thích, xem lịch trống trực tuyến và
            đặt ngay chỉ với vài thao tác. Hệ thống sân sạch đẹp, đầy đủ ánh sáng
            và trang thiết bị chuẩn chuyên nghiệp.
          </p>
          <div class="hero-actions">
            <a href="#book" class="btn btn-primary">Đặt sân ngay</a>
            <a href="gioi-thieu.html" class="btn btn-ghost">Tìm hiểu thêm</a>
          </div>
        </div>
        <div class="hero-card">
          <p class="hero-card-label">Khung giờ trống hôm nay</p>
          <ul class="slot-list">
            <li><span>06:00 - 07:30</span><em class="free">Trống</em></li>
            <li><span>18:30 - 20:00</span><em class="busy">Kín</em></li>
            <li><span>20:00 - 21:30</span><em class="free">Trống</em></li>
            <li><span>21:30 - 23:00</span><em class="free">Trống</em></li>
          </ul>
          <a href="#book" class="booking-link">Chọn giờ của bạn →</a>
        </div>
      </div>
    </section>

    <section class="stats">
      <div class="container stats-inner">
        <div class="stat"><strong>10+</strong><span>Sân liên kết</span></div>
        <div class="stat"><strong>5.000+</strong><span>Khách hàng</span></div>
        <div class="stat"><strong>24/7</strong><span>Hỗ trợ đặt sân</span></div>
        <div class="stat"><strong>4.9/5</strong><span>Đánh giá trung bình</span></div>
      </div>
    </section>

    <section class="section" id="dich-vu">
      <div class="container">
        <p class="eyebrow">Vì sao chọn chúng tôi</p>
        <h2>Dịch vụ đặt sân tiện lợi nhất</h2>
        <div class="cards">
          <article class="card">
            <h3>Đặt nhanh, xác nhận tức thì</h3>
            <p>
              Lịch trống được cập nhật theo thời gian thực. Chọn sân và khung giờ,
              đặt lịch là có ngay xác nhận trong vài giây.
            </p>
          </article>
          <article class="card">
            <h3>Sân đạt chuẩn, thắp sáng full</h3>
            <p>
              Mặt cỏ nhân tạo chất lượng cao, thảm đều, đầy đủ lưới chắn, thay đồ
              và sân được bảo trì thường xuyên.
            </p>
          </article>
          <article class="card">
            <h3>Giá minh bạch, không lo phí ẩn</h3>
            <p>
              Niêm yết giá theo giờ rõ ràng cho từng loại sân. Thanh toán dễ dàng,
              hủy lịch linh hoạt theo chính sách.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-alt" id="san">
      <div class="container">
        <p class="eyebrow">Lựa chọn của bạn</p>
        <h2>Các loại sân phổ biến</h2>
        <div class="cards">
          <article class="card">
            <p class="card-tag">Sân 5 người</p>
            <h3>Đá nhỏ, vui cũng đủ</h3>
            <p>Kích thước linh hoạt, phù hợp nhóm bạn bè ít người.</p>
            <p class="price">Từ 150.000đ / giờ</p>
          </article>
          <article class="card card-featured">
            <p class="card-tag">Sân 7 người</p>
            <h3>Cân bằng và phổ biến</h3>
            <p>Lựa chọn được yêu thích nhất với nhóm 8 - 14 người.</p>
            <p class="price">Từ 250.000đ / giờ</p>
          </article>
          <article class="card">
            <p class="card-tag">Sân 11 người</p>
            <h3>Đấu đúng luật thi đấu</h3>
            <p>Diện tích tiêu chuẩn cho các trận đấu và giải phong trào.</p>
            <p class="price">Từ 500.000đ / giờ</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="book">
      <div class="container narrow">
        <p class="eyebrow">Đặt lịch hôm nay</p>
        <h2>Đăng ký đặt sân</h2>
        <form id="bookForm" class="book-form" novalidate>
          <label>
            Họ và tên
            <input type="text" name="name" required placeholder="Nguyễn Văn A" />
          </label>
          <label>
            Số điện thoại
            <input type="tel" name="phone" required placeholder="0123 456 789" />
          </label>
          <label>
            Loại sân
            <select name="field" required>
              <option value="">Chọn loại sân</option>
              <option>Sân 5 người</option>
              <option>Sân 7 người</option>
              <option>Sân 11 người</option>
            </select>
          </label>
          <label>
            Ngày và giờ
            <input type="datetime-local" name="time" required />
          </label>
          <button type="submit" class="btn btn-primary btn-block">Gửi yêu cầu đặt sân</button>
          <p class="form-note">Chúng tôi sẽ gọi xác nhận trong vòng 15 phút.</p>
          <p id="formMessage" class="form-message" role="status"></p>
        </form>
      </div>
    </section>
  </main>

  ${renderFooter()}
`

setupNav()

const form = document.querySelector('#bookForm')
const message = document.querySelector('#formMessage')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }
  message.textContent = 'Cảm ơn bạn! Yêu cầu đặt sân đã được ghi nhận, chúng tôi sẽ liên hệ xác nhận.'
  message.classList.add('ok')
  form.reset()
})