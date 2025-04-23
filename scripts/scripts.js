import config from './config.json';

// Initialize Supabase
const SUPABASE_URL = "https://frtueyicmjftwtsrmxfi.supabase.co"; // Your Supabase URL
const SUPABASE_KEY = "your-supabase-key"; // Replace with your actual Supabase API Key
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
  // Form Validation
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const inputs = form.querySelectorAll("input[required]");
      let isValid = true;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add("border-red-500");
          input.nextElementSibling?.classList.add("text-red-500");
        } else {
          input.classList.remove("border-red-500");
          input.nextElementSibling?.classList.remove("text-red-500");
        }
      });

      if (!isValid) {
        e.preventDefault();
        alert("Please fill in all required fields.");
      }
    });
  });

  // Handle Sign Up Form Submission
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      if (!passwordRegex.test(password)) {
        alert("Password must be at least 8 characters long and include both letters and numbers.");
        return;
      }

      try {
        const { user, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          alert(error.message);
          return;
        }

        alert("Sign-up successful! Please check your email to confirm your account.");
        window.location.href = "/login.html";
      } catch (err) {
        console.error("Sign-up error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Handle Login Form Submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const { user, session, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert(error.message);
          return;
        }

        alert("Login successful!");
        window.location.href = "/dashboard.html";
      } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Handle Google Login
  const googleLoginButton = document.getElementById("googleLogin");
  if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
      try {
        const { user, session, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
        });

        if (error) {
          alert(error.message);
          return;
        }

        alert("Login successful!");
        window.location.href = "/dashboard.html";
      } catch (err) {
        console.error("Google login error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Handle Upload Form Submission
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById("file");
      const formData = new FormData(uploadForm);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload document.");
        }

        alert("Document uploaded successfully!");
        uploadForm.reset();
      } catch (err) {
        console.error("Upload error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Handle Password Visibility Toggle
  const togglePasswordButtons = document.querySelectorAll("#togglePassword");
  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const passwordInput = button.previousElementSibling;
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        button.textContent = "Hide";
      } else {
        passwordInput.type = "password";
        button.textContent = "Show";
      }
    });
  });

  // Check Authentication on Page Load
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session && !window.location.pathname.includes("login.html")) {
      window.location.href = "/login.html";
    }
  })();

  // Handle Logout
  const logoutButton = document.getElementById("logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          alert(error.message);
          return;
        }

        alert("Logged out successfully!");
        window.location.href = "/login.html";
      } catch (err) {
        console.error("Logout error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Mobile Menu Toggle
  const nav = document.querySelector("header nav");
  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Menu";
  toggleButton.classList.add("bg-blue-600", "text-white", "px-4", "py-2", "rounded", "md:hidden");
  toggleButton.addEventListener("click", () => {
    nav.classList.toggle("hidden");
  });

  nav.parentElement.insertBefore(toggleButton, nav);
  nav.classList.add("hidden", "md:flex");
});

// Simple Slider for Featured Documents
let currentSlide = 0;
const slides = document.querySelectorAll(".featured-slide");
const totalSlides = slides.length;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("hidden", i !== index);
  });
}

document.getElementById("prevSlide").addEventListener("click", () => {
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  showSlide(currentSlide);
});

document.getElementById("nextSlide").addEventListener("click", () => {
  currentSlide = (currentSlide + 1) % totalSlides;
  showSlide(currentSlide);
});

// API Call Example for Document Search
async function searchDocuments(query) {
  try {
    const response = await fetch(`${config.api.baseUrl}/search?query=${query}`);
    if (!response.ok) throw new Error("Failed to fetch documents");

    const documents = await response.json();
    const resultsContainer = document.getElementById("searchResults");
    resultsContainer.innerHTML = "";

    documents.forEach((doc) => {
      const docElement = `
        <div class="bg-gray-100 p-4 rounded shadow">
          <h4 class="font-bold text-lg mb-2">${doc.title}</h4>
          <p class="text-sm mb-2">By ${doc.author} • ${doc.category}</p>
          <a href="${doc.link}" class="text-blue-600 hover:underline">Download</a>
        </div>
      `;
      resultsContainer.innerHTML += docElement;
    });
  } catch (error) {
    console.error(error);
    alert("An error occurred while searching for documents.");
  }
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (query.length > 2) searchDocuments(query);
});

// Local Document Filtering
const documents = [
  { title: "Crop Protection Guide", author: "Jane Doe", category: "Agriculture", link: "#" },
  { title: "TVET Curriculum Outline", author: "Edwin Chesaro", category: "Curriculum", link: "#" },
  { title: "Lesson Plan Template", author: "Edwin Chesaro", category: "Teaching Aids", link: "#" },
];

function filterDocuments() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = ""; // Clear previous results

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(query) || 
    doc.author.toLowerCase().includes(query) || 
    doc.category.toLowerCase().includes(query)
  );

  if (filteredDocs.length === 0) {
    resultsContainer.innerHTML = "<p class='text-gray-500'>No documents found.</p>";
    return;
  }

  filteredDocs.forEach(doc => {
    const docElement = `
      <div class="bg-gray-100 p-4 rounded shadow">
        <h4 class="font-bold text-lg mb-2">${doc.title}</h4>
        <p class="text-sm mb-2">By ${doc.author} • ${doc.category}</p>
        <a href="${doc.link}" class="text-blue-600 hover:underline">Download</a>
      </div>
    `;
    resultsContainer.innerHTML += docElement;
  });
}

// Handle Reset Password Form Submission
document.addEventListener("DOMContentLoaded", () => {
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  if (resetPasswordForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      alert("Invalid or missing token. Please try resetting your password again.");
      window.location.href = "/index.html";
      return;
    }

    resetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword").value;

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        alert("Password must be at least 8 characters long and include both letters and numbers.");
        return;
      }

      try {
        const response = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.msg);
          window.location.href = "/login.html";
        } else {
          alert(result.msg);
        }
      } catch (error) {
        alert("An error occurred. Please try again later.");
        console.error(error);
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelector(".slides");
  const slideCount = document.querySelectorAll(".slide").length;
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");

  let currentIndex = 0;

  // Function to update the slider position
  function updateSliderPosition() {
    slides.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  // Move to the next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % slideCount; // Loop back to the first slide
    updateSliderPosition();
  }

  // Move to the previous slide
  function prevSlide() {
    currentIndex = (currentIndex - 1 + slideCount) % slideCount; // Loop back to the last slide
    updateSliderPosition();
  }

  // Event listeners for navigation buttons
  prevButton.addEventListener("click", prevSlide);
  nextButton.addEventListener("click", nextSlide);

  // Auto-slide every 3 seconds
  setInterval(nextSlide, 3000);
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("darkModeToggle");
  const darkModeIcon = document.getElementById("darkModeIcon");
  const htmlElement = document.documentElement;

  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    htmlElement.classList.toggle("dark", savedTheme === "dark");
    darkModeIcon.classList.toggle("fa-sun", savedTheme === "dark");
    darkModeIcon.classList.toggle("fa-moon", savedTheme !== "dark");
  }

  // Toggle dark mode on button click
  toggleButton.addEventListener("click", () => {
    const isDarkMode = htmlElement.classList.toggle("dark");
    darkModeIcon.classList.toggle("fa-sun", isDarkMode);
    darkModeIcon.classList.toggle("fa-moon", !isDarkMode);

    // Save the theme preference in localStorage
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  });
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});