const CONTACT_WEBHOOK_URL = String(window.NIGHTLOG_WEBHOOK_URL || "").trim();

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("site-nav");
const yearNode = document.getElementById("year");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setStatus(message, type) {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.classList.remove("success", "error");

  if (type) {
    formStatus.classList.add(type);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function openMailClient(data) {
  const subject = `[NightLog 문의] ${data.subject}`;
  const body = [`이름: ${data.name}`, `이메일: ${data.email}`, "", data.message].join("\n");

  const href = `mailto:support@nightlog.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("", "");

    const formData = new FormData(contactForm);
    const payload = {
      type: "nightlog_contact",
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      source: "nightlog-homepage",
      sentAt: new Date().toISOString(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setStatus("필수 항목을 모두 입력해주세요.", "error");
      return;
    }

    if (!isValidEmail(payload.email)) {
      setStatus("이메일 형식을 확인해주세요.", "error");
      return;
    }

    const submitButton = contactForm.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      if (CONTACT_WEBHOOK_URL) {
        const response = await fetch(CONTACT_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "nightlog-homepage",
          },
          body: JSON.stringify({
            title: `[NightLog 문의] ${payload.subject}`,
            payload,
          }),
        });

        if (!response.ok) {
          throw new Error(`웹훅 전송 실패: ${response.status}`);
        }

        setStatus("문의가 전송되었습니다. 빠르게 확인 후 답변드릴게요.", "success");
        contactForm.reset();
      } else {
        openMailClient(payload);
        setStatus("메일 앱이 열렸습니다. 전송을 완료해주세요.", "success");
      }
    } catch (error) {
      console.error(error);
      setStatus("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

const revealNodes = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.1,
    },
  );

  revealNodes.forEach((node) => {
    if (!node.classList.contains("is-visible")) {
      observer.observe(node);
    }
  });
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}
