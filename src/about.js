import './style.css'
import { renderHeader, renderFooter, setupNav } from './layout.js'

document.querySelector('#app').innerHTML = `
  ${renderHeader('gioi-thieu.html')}

  <main>
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Về chúng tôi</p>
        <h1>Hành trình của Đặt Sân Bóng Đá</h1>
        <p class="page-hero-desc">
          Chúng tôi ra đời từ một niềm vui rất đơn giản: ai cũng xứng đáng có một
          sân bóng tốt, đúng giá và đặt trong tích tắc.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container narrow">
        <h2>Câu chuyện của chúng tôi</h2>
        <p>
          Bắt đầu từ năm 2024, khi nhóm sáng lập quá mệt mỏi với việc gọi vài cuộc
          điện thoại chỉ để tìm một khung giờ trống, chúng tôi quyết định xây dựng
          một nền tảng đặt sân bóng trực tuyến. Từ một sân thử nghiệm tại quận 5,
          đến nay chúng tôi đã liên kết với hơn 10 sân trên khắp thành phố.
        </p>
        <p>
          Mục tiêu của chúng tôi không chỉ là giúp bạn đặt được chỗ chơi, mà còn là
          giữ cho bóng đá phong trào gần gũi, dễ tiếp cận và công bằng cho tất cả
          mọi người - từ nhóm bạn nghiệp dư đến các đội thi đấu chuyên nghiệp hơn.
        </p>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <p class="eyebrow">Điều chúng tôi theo đuổi</p>
        <h2>Giá trị cốt lõi</h2>
        <div class="cards">
          <article class="card">
            <h3>Tận tâm với người chơi</h3>
            <p>
              Mọi quyết định đều đặt trải nghiệm của bạn lên hàng đầu, từ chọn sân,
              đặt giờ cho đến các chính sách hỗ trợ.
            </p>
          </article>
          <article class="card">
            <h3>Minh bạch & công bằng</h3>
            <p>
              Giá rõ ràng, thanh toán minh bạch, và một quy trình đặt sân ai cũng
              hiểu được ngay lần đầu.
            </p>
          </article>
          <article class="card">
            <h3>Cải tiến không ngừng</h3>
            <p>
              Chúng tôi lắng nghe phản hồi mỗi tuần và liên tục nâng cấp chất lượng
              sân cũng như trải nghiệm đặt lịch.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container narrow">
        <h2>Đội ngũ của chúng tôi</h2>
        <p>
          Đội ngũ nhỏ nhưng giàu nhiệt huyết gồm những người từng chơi và quản lý
          bóng đá phong trào. Chúng tôi hiểu việc giữ được khung giờ, đúng người đúng
          sân quan trọng với bạn đến nhường nào.
        </p>
        <div class="team-grid">
          <div class="team-card">
            <h3>Minh Đức</h3>
            <p>Đồng sáng lập · Cựu cầu thủ phong trào</p>
          </div>
          <div class="team-card">
            <h3>Thu Hà</h3>
            <p>Đồng sáng lập · Vận hành sân</p>
          </div>
          <div class="team-card">
            <h3>Hoàng Nam</h3>
            <p>Kỹ thuật & Trải nghiệm sản phẩm</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-cta">
      <div class="container narrow">
        <h2>Sẵn sàng ra sân?</h2>
        <p>Tìm khung giờ trống gần bạn ngay bây giờ.</p>
        <a href="index.html#book" class="btn btn-primary">Đặt sân ngay</a>
      </div>
    </section>
  </main>

  ${renderFooter()}
`

setupNav()