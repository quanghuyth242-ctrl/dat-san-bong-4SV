var VENUES = [
  {
    id: 1,
    name: "Sân Bóng Đá Thành Công",
    sport: "Bóng đá",
    addr: "18 Thành Công, Ba Đình, Hà Nội",
    price: "300k",
    per: "/tiếng",
    courts: 3,
    img: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&q=75",
    icon: "⚽",
  },
  {
    id: 2,
    name: "Tennis Club Cầu Giấy",
    sport: "Tennis",
    addr: "68 Cầu Giấy, Hà Nội",
    price: "250k",
    per: "/tiếng",
    courts: 4,
    img: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=75",
    icon: "🎾",
  },
  {
    id: 3,
    name: "Nhà Thi Đấu Cầu Lông Mỹ Đình",
    sport: "Cầu lông",
    addr: "Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
    price: "120k",
    per: "/tiếng",
    courts: 6,
    img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&q=75",
    icon: "🏸",
  },
  {
    id: 4,
    name: "Pickleball Arena Q.1",
    sport: "Pickleball",
    addr: "28 Thảo Điền, Thủ Đức, TP.HCM",
    price: "180k",
    per: "/tiếng",
    courts: 2,
    img: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=400&q=75",
    icon: "🏓",
  },
  {
    id: 5,
    name: "Sân Bóng Rổ Tây Hồ",
    sport: "Bóng rổ",
    addr: "Ngõ 431 Âu Cơ, Tây Hồ, Hà Nội",
    price: "200k",
    per: "/tiếng",
    courts: 2,
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=75",
    icon: "🏀",
  },
  {
    id: 6,
    name: "Sân Bóng Chuyền Hoàng Hoa Thám",
    sport: "Bóng chuyền",
    addr: "290 Hoàng Hoa Thám, Ba Đình, Hà Nội",
    price: "150k",
    per: "/tiếng",
    courts: 2,
    img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&q=75",
    icon: "🏐",
  },
  {
    id: 7,
    name: "Bóng Đá Mini Đầm Hồng",
    sport: "Bóng đá",
    addr: "KĐT Đầm Hồng, Thanh Xuân, Hà Nội",
    price: "400k",
    per: "/tiếng",
    courts: 5,
    img: "https://images.unsplash.com/photo-1579952363873-27f3bfad9c0d?w=400&q=75",
    icon: "⚽",
  },
  {
    id: 8,
    name: "Ace Pickleball Club",
    sport: "Pickleball",
    addr: "Pullman Hanoi, Cát Linh, Đống Đa, Hà Nội",
    price: "220k",
    per: "/tiếng",
    courts: 2,
    img: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400&q=75",
    icon: "🏓",
  },
];

var PROVINCES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Bình Dương",
  "Đồng Nai",
  "Khánh Hòa",
  "Nghệ An",
  "Thanh Hóa",
  "Huế",
  "Quảng Ninh",
  "Bà Rịa - Vũng Tàu",
  "Lâm Đồng",
  "Kiên Giang",
  "Bắc Ninh",
  "Hải Dương",
  "Hưng Yên",
  "Nam Định",
  "Thái Nguyên",
  "Quảng Nam",
  "Bình Định",
  "Gia Lai",
  "Đắk Lắk",
  "Long An",
  "Tiền Giang",
  "Vĩnh Long",
  "An Giang",
  "Bình Thuận",
  "Ninh Thuận",
  "Phú Yên",
  "Quảng Ngãi",
  "Bình Phước",
  "Tây Ninh",
];

function renderVenues(list) {
  var grid = document.getElementById("featuredGrid");
  if (!grid) return;
  grid.innerHTML = list
    .map(function (v) {
      return (
        '<div class="court-card">' +
        '<div class="court-img-wrap"><img src="' +
        v.img +
        '" alt="' +
        v.name +
        '" loading="lazy"><span class="court-badge">' +
        v.icon +
        " " +
        v.sport +
        "</span></div>" +
        '<div class="court-body"><div class="court-name">' +
        v.name +
        "</div>" +
        '<div class="court-addr"><i class="fa-solid fa-location-dot"></i><span>' +
        v.addr +
        "</span></div>" +
        '<div class="court-meta"><div class="court-price">' +
        v.price +
        " <small>" +
        v.per +
        '</small></div><div style="font-size:.82rem;color:var(--grey-600)">' +
        v.courts +
        " sân</div></div>" +
        '<a href="#" class="btn-book" onclick="toast(\'Đã thêm vào yêu thích: ' +
        v.name +
        "');return false\">Xem chi tiết</a></div></div>"
      );
    })
    .join("");
}

function renderNearby(list) {
  var ul = document.getElementById("nearbyList");
  var count = document.getElementById("mapCount");
  if (count) count.textContent = list.length;
  if (!ul) return;
  ul.innerHTML = list
    .slice(0, 4)
    .map(function (v) {
      return (
        '<li><img class="nearby-thumb" src="' +
        v.img +
        '" alt=""><div><div class="nearby-name">' +
        v.name +
        '</div><div class="nearby-addr">' +
        v.addr +
        '</div></div><span style="margin-left:auto;font-size:.78rem;font-weight:700;color:var(--green-primary)">' +
        v.price +
        "</span></li>"
      );
    })
    .join("");
}

function renderProvinces(sportKey) {
  var grid = document.getElementById("provinceGrid");
  if (!grid) return;
  var labels = {
    "bong-da": "Bóng đá",
    tennis: "Tennis",
    "cau-long": "Cầu lông",
    pickleball: "Pickleball",
    "bong-ro": "Bóng rổ",
    "bong-chuyen": "Bóng chuyền",
  };
  var label = labels[sportKey] || "Bóng đá";
  grid.innerHTML = PROVINCES.map(function (p) {
    var n = Math.floor(Math.random() * 40) + 8;
    return (
      '<a href="#" class="province-card" onclick="toast(\'Tìm sân ' +
      label +
      " tại " +
      p +
      '\');return false"><span><span class="province-name">' +
      p +
      '</span><span class="province-count" style="display:block">' +
      n +
      " sân " +
      label +
      '</span></span><i class="fa-solid fa-chevron-right"></i></a>'
    );
  }).join("");
}

function handleSearch(e) {
  e.preventDefault();
  var loc = document.getElementById("qLocation").value.trim().toLowerCase();
  var sport = document.getElementById("qSport").value;
  var filtered = VENUES.filter(function (v) {
    var okLoc =
      !loc ||
      v.addr.toLowerCase().indexOf(loc) !== -1 ||
      v.name.toLowerCase().indexOf(loc) !== -1;
    var okSport = !sport || v.sport === sport;
    return okLoc && okSport;
  });
  if (filtered.length === 0) {
    toast("Không tìm thấy sân phù hợp, hiển thị tất cả");
    filtered = VENUES;
  } else {
    toast("Tìm thấy " + filtered.length + " sân phù hợp");
  }
  renderVenues(filtered);
  renderNearby(filtered);
  document
    .getElementById("san-noi-bat")
    .scrollIntoView({ behavior: "smooth", block: "start" });
  return false;
}

function toast(msg) {
  var t = document.createElement("div");
  t.className = "toast-4sv";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function () {
    t.classList.add("show");
  });
  setTimeout(function () {
    t.classList.remove("show");
    setTimeout(function () {
      t.remove();
    }, 250);
  }, 2500);
}
function locateMe() {
  toast("Đang lấy vị trí của bạn...");
}
function subscribe(e) {
  e.preventDefault();
  toast("Đăng ký thành công! Voucher đã gửi qua email.");
  e.target.reset();
  return false;
}

document.addEventListener("DOMContentLoaded", function () {
  // year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
  // initial render
  renderVenues(VENUES);
  renderNearby(VENUES);
  renderProvinces("bong-da");

  // sport grid filter
  document.querySelectorAll(".sport-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      var s = card.getAttribute("data-sport");
      document.querySelectorAll(".sport-card").forEach(function (c) {
        c.classList.remove("active");
      });
      card.classList.add("active");
      if (!s) {
        renderVenues(VENUES);
        renderNearby(VENUES);
        toast("Hiển thị tất cả sân");
      } else {
        var f = VENUES.filter(function (v) {
          return v.sport === s;
        });
        if (f.length === 0) {
          toast("Chưa có sân " + s + " nổi bật");
          f = VENUES;
        } else {
          toast(f.length + " sân " + s);
        }
        renderVenues(f);
        renderNearby(f);
      }
      document
        .getElementById("san-noi-bat")
        .scrollIntoView({ behavior: "smooth" });
    });
  });

  // province tabs
  document.querySelectorAll(".sport-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".sport-tab").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      renderProvinces(btn.getAttribute("data-sport"));
    });
  });

  // mobile nav toggle
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.contains("open");
      navMenu.classList.toggle("open", !isOpen);
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      navToggle.innerHTML = isOpen
        ? '<i class="fa-solid fa-bars"></i>'
        : '<i class="fa-solid fa-xmark"></i>';
    });
  }

  // dropdown
  var dropdowns = document.querySelectorAll(".dropdown");
  dropdowns.forEach(function (dd) {
    var toggle = dd.querySelector(".dropdown-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      var isOpen = dd.classList.contains("open");
      closeAllDd();
      if (!isOpen) dd.classList.add("open");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown")) closeAllDd();
    // close mobile nav when clicking outside
    if (
      navMenu &&
      navToggle &&
      !e.target.closest("#navMenu") &&
      !e.target.closest("#navToggle")
    ) {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllDd();
      if (navMenu) navMenu.classList.remove("open");
    }
  });
  function closeAllDd() {
    dropdowns.forEach(function (dd) {
      dd.classList.remove("open");
    });
  }
});
