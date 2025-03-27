(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const createElement = (htmlTemplate) => {
  const $el = document.createElement("div");
  $el.innerHTML = htmlTemplate.trim();
  const firstChild = $el.firstChild;
  if (firstChild instanceof Element) {
    return firstChild;
  } else {
    return document.createElement("div");
  }
};
const Footer = () => {
  return createElement(
    /*html*/
    `
        <footer class="footer">
        <p>&copy; 우아한테크코스 All Rights Reserved.</p>
        <p><img src="./images/woowacourse_logo.png" width="180" /></p>
      </footer>
    `
  );
};
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const Button = ({ text, className }) => {
  const button = document.createElement("button");
  button.classList.add(...className);
  button.textContent = text;
  return button;
};
const Rate = ({ rate, className = [], isFilled = false }) => {
  const starImgSrc = isFilled ? "./images/star_filled.png" : "./images/star_empty.png";
  const rateElement = createElement(
    /*html*/
    `
    <div class="rate">
        <img src=${starImgSrc} class="star" />
        <span class=${className == null ? void 0 : className.join(" ")}>${rate.toFixed(1)}</span>
    </div>
    `
  );
  return rateElement;
};
const SkeletonMovieItem = () => {
  return createElement(
    /*html*/
    `
    <li class="skeleton">
      <div class="item">
        <div class="thumbnail skeleton-box"></div> 
        <div class="item-desc skeleton-box">
          <p class="rate">
            <div class="star skeleton-box"></div>
            <span class="skeleton-box rate-placeholder"></span>
          </p>
          <strong class="skeleton-box title-placeholder"></strong>
        </div>
      </div>
    </li>
  `
  );
};
const OPTIONS = {
  headers: {
    Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOWEwZmY0MWMzZWEwYzgzZDM4NzUyMDEyMDZjZTQ4OCIsIm5iZiI6MTc0MjI3MTM3OS4yNjksInN1YiI6IjY3ZDhmMzkzMzU3MmFmNWJjYzA4N2YzNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.nsiAdq7QtxeJ1-6ogVOc9BMxak9H9jVPuvHaOWHU7hA"}`,
    accept: "application/json"
  }
};
const showSkeleton = (count = 20) => {
  const container = $(".thumbnail-list");
  if (!container) return;
  for (let i = 0; i < count; i++) {
    container.appendChild(SkeletonMovieItem());
  }
};
const hideSkeleton = () => {
  var _a;
  (_a = $$(".skeleton")) == null ? void 0 : _a.forEach((s) => s.remove());
};
const fetchPopularMovieList = async (currentPage2) => {
  showSkeleton();
  try {
    const url = `https://api.themoviedb.org/3/movie/popular?include_adult=false&language=ko-KR&page=${currentPage2}`;
    const response = await fetch(url, OPTIONS);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    hideSkeleton();
    return data;
  } catch (error) {
    console.error("데이터 로드 실패:", error);
    hideSkeleton();
    throw error;
  }
};
const fetchSearchMovieList = async (search, currentPage2) => {
  showSkeleton();
  try {
    const url = `https://api.themoviedb.org/3/search/movie?query=${search}&include_adult=false&language=ko-KR&page=${currentPage2}`;
    const response = await fetch(url, OPTIONS);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    hideSkeleton();
    return data;
  } catch (error) {
    console.error("검색 데이터 로드 실패:", error);
    hideSkeleton();
    throw error;
  }
};
const fetchMovieDetails = async (movieId) => {
  try {
    const url = `https://api.themoviedb.org/3/movie/${movieId}?language=ko-KR`;
    const response = await fetch(url, OPTIONS);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("데이터 로드 실패:", error);
    throw error;
  }
};
const RATING_KEY = "userRatings";
const saveUserRating = (movieId, score) => {
  const ratings = JSON.parse(localStorage.getItem(RATING_KEY) || "{}");
  ratings[movieId] = { score };
  localStorage.setItem(RATING_KEY, JSON.stringify(ratings));
};
const getUserRating = (movieId) => {
  const ratings = JSON.parse(localStorage.getItem(RATING_KEY) || "{}");
  return ratings[movieId] || null;
};
const SCORE_AND_LABEL = {
  0: "평가하지 않았어요",
  2: "최악이에요",
  4: "별로예요",
  6: "보통이에요",
  8: "재미있어요",
  10: "명작이에요"
};
const MyRating = (movie) => {
  const myRate = getUserRating(movie.id);
  const myScore = myRate ? myRate.score : 0;
  const filledCount = myRate ? myRate.score / 2 : 0;
  const starsHTML = Array.from({ length: 5 }).map((_, i) => {
    const src = i < filledCount ? "./images/star_filled.png" : "./images/star_empty.png";
    return `<img src="${src}" class="star" data-index="${i}" />`;
  }).join("");
  const myRating = createElement(
    /*html*/
    `
    <div>
      <h3>내 별점</h3>
      <div class="my-rate">
        <div class="star-container">
          ${starsHTML}
        </div>
        <div class="label">
          <div>${SCORE_AND_LABEL[myScore]}</div>
          <div class="score">(${myScore}/10)</div>
        </div>
      </div>
    </div>
  `
  );
  const starContainer = $(".star-container", myRating);
  const label = $(".label div", myRating);
  const score = $(".score", myRating);
  const stars = $$(".star", starContainer);
  let currentScore = 0;
  let selectedScore = 0;
  let selectedStarIdx = -1;
  stars.forEach((star, i) => {
    star.addEventListener("mouseover", () => {
      currentScore = (i + 1) * 2;
      stars.forEach((s, j) => {
        s.setAttribute(
          "src",
          j <= i ? "./images/star_filled.png" : "./images/star_empty.png"
        );
      });
      label.textContent = SCORE_AND_LABEL[currentScore];
      score.textContent = `(${currentScore}/10)`;
    });
    star.addEventListener("mouseleave", () => {
      if (selectedScore === 0 && myScore !== 0) {
        selectedScore = myScore;
        selectedStarIdx = filledCount - 1;
      }
      if (selectedStarIdx === -1) {
        stars.forEach((s) => {
          s.setAttribute("src", "./images/star_empty.png");
        });
        currentScore = 0;
        label.textContent = SCORE_AND_LABEL[currentScore];
        score.textContent = `(${currentScore}/10)`;
      } else {
        selectedScore = (selectedStarIdx + 1) * 2;
        stars.forEach((s, j) => {
          s.setAttribute(
            "src",
            j <= selectedStarIdx ? "./images/star_filled.png" : "./images/star_empty.png"
          );
        });
        label.textContent = SCORE_AND_LABEL[selectedScore];
        score.textContent = `(${selectedScore}/10)`;
      }
    });
    star.addEventListener("click", () => {
      currentScore = (i + 1) * 2;
      selectedStarIdx = i;
      stars.forEach((s, j) => {
        s.setAttribute(
          "src",
          j <= i ? "./images/star_filled.png" : "./images/star_empty.png"
        );
      });
      label.textContent = SCORE_AND_LABEL[currentScore];
      score.textContent = `(${currentScore}/10)`;
      saveUserRating(movie.id, currentScore);
    });
  });
  return myRating;
};
const MovieDetailModal = (movie) => {
  var _a;
  const modalDetailModal = createElement(
    /*html*/
    `
    <div class="modal-background active">
      <div class="modal">
        <button class="close-modal" aria-label="Close modal"><img src="./images/modal_button_close.png"/></button>
        <div class="modal-container">
          <div class="modal-image">
            <img
              src="${movie.poster_path ? `https://image.tmdb.org/t/p/w440_and_h660_face/${movie.poster_path}` : "./images/default_poster.png"}"
              alt="${movie.title}"
            />
          </div>
          <div class="modal-description">
            <h2 class="movie-title">${movie.title}</h2>
            <div class="movie-genre">
                ${movie.release_date.slice(0, 4)} ·
                ${movie.genres.map((genre) => genre.name).join(", ")}
            </div>
            <div class="modal-rate-container">
              <div class="label">평균</div>
              <div>${Rate({
      rate: movie.vote_average,
      className: ["modal-rate"],
      isFilled: true
    }).outerHTML}</div>
            </div>
            <hr>
            <div class="my-rate-container"></div>
            <hr>
            ${movie.overview ? `<h3>줄거리</h3><div class="detail">${movie.overview}</div>` : ""}
          </div>
        </div>
      </div>
    </div>
  `
  );
  const closeModal = () => {
    modalDetailModal.classList.remove("active");
    document.body.classList.remove("modal-open");
    modalDetailModal.remove();
  };
  (_a = $(".close-modal", modalDetailModal)) == null ? void 0 : _a.addEventListener("click", closeModal);
  $(".my-rate-container", modalDetailModal).appendChild(MyRating(movie));
  modalDetailModal.addEventListener("click", (e) => {
    if (e.target === modalDetailModal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  return modalDetailModal;
};
const MovieItem = ({ src, rate, title, clickEvent }) => {
  const movieItem = createElement(
    /*html*/
    `
    <li>
      <div class="item">
        <img
          class="thumbnail"
          src=${src}
          alt=${title}
        />
        <div class="item-desc">
          <strong>${title}</strong>
        </div>
      </div>
    </li>
  `
  );
  $(".item-desc", movieItem).prepend(Rate({ rate }));
  $(".item", movieItem).addEventListener("click", clickEvent);
  return movieItem;
};
const loadMovies = async (movies) => {
  movies.results.forEach((movie) => {
    const posterPath = movie.poster_path;
    const movieElement = MovieItem({
      src: posterPath ? `https://image.tmdb.org/t/p/w440_and_h660_face/${movie.poster_path}` : "./images/default_poster.png",
      title: movie.title,
      rate: movie.vote_average,
      clickEvent: () => showMovieDetailInfo(movie)
    });
    $(".thumbnail-list").appendChild(movieElement);
  });
  if (movies.page === movies.total_pages) return;
};
const showMovieDetailInfo = async (movie) => {
  const movieInfo = await fetchMovieDetails(movie.id);
  document.body.classList.add("modal-open");
  $("#app").appendChild(MovieDetailModal(movieInfo));
};
const NoSearchResults = (text) => {
  return createElement(
    /*html*/
    `
    <div class="no-result">
      <img src="./images/no_result_logo.png" alt="검색 결과 없음"/>
      <h2>${text}</h2>
    </div>  
  `
  );
};
let currentMode = "popular";
let currentPage = {
  popular: 1,
  search: 1
};
let maxPage = {
  popular: Infinity,
  search: Infinity
};
let currentSearchKeyword = "";
const movieState = {
  getMode: () => currentMode,
  setMode: (mode) => {
    currentMode = mode;
  },
  getCurrentPage: () => currentPage[currentMode],
  increasePage: () => {
    currentPage[currentMode]++;
  },
  resetPage: () => {
    currentPage[currentMode] = 1;
  },
  getMaxPage: () => maxPage[currentMode],
  setMaxPage: (max) => {
    maxPage[currentMode] = max;
  },
  getSearchKeyword: () => currentSearchKeyword,
  setSearchKeyword: (keyword) => {
    currentSearchKeyword = keyword;
  }
};
const SearchBar = () => {
  const searchBar = document.createElement("div");
  searchBar.classList.add("search-bar");
  const input = document.createElement("input");
  input.setAttribute("placeholder", "검색어를 입력하세요");
  input.type = "text";
  searchBar.appendChild(input);
  const button = document.createElement("button");
  button.innerText = "🔎";
  button.type = "button";
  searchBar.appendChild(button);
  button.addEventListener("click", () => {
    searchMovie(input.value);
  });
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      searchMovie(input.value);
    }
  });
  return searchBar;
};
const searchMovie = async (input) => {
  movieState.setMode("search");
  $(".thumbnail-list").replaceChildren();
  $("#caption").innerText = `"${input}" 검색 결과`;
  try {
    movieState.setSearchKeyword(input);
    const movies = await fetchSearchMovieList(
      movieState.getSearchKeyword(),
      movieState.getCurrentPage()
    );
    movieState.setMaxPage(movies.total_pages);
    $(".top-rated-container").classList.add("hidden");
    $(".overlay-img").classList.add("hidden");
    if (movies.results.length === 0 && !$(".no-result")) {
      $(".thumbnail-list").after(NoSearchResults("검색 결과가 없습니다."));
      return;
    }
    if ($(".no-result")) $(".no-result").remove();
    loadMovies(movies);
  } catch (error) {
    console.log(error);
    $(".thumbnail-list").after(
      NoSearchResults("영화 목록을 가져오는 데 실패했습니다.")
    );
  }
};
const Header = ({ title, imageUrl, voteAverage }) => {
  const header = createElement(
    /*html*/
    `
    <header>
      <div class="background-container">
        <div class="overlay" aria-hidden="true">
        <img src=${imageUrl} class="overlay-img" />
        <div class="backdrop"></div>
      </div>
        
        <div class="logo-search-container">
          <h1 class="logo">
            <img src="./images/logo.png" alt="MovieList" />
          </h1>
        </div>
        
        <div class="top-rated-container">
          <div class="top-rated-movie">
            <div class="title">${title}</div>
        </div>
      </div>
    </header>
  `
  );
  const searchBar = SearchBar();
  const rate = Rate({ rate: voteAverage, className: ["rate-value"] });
  const button = Button({
    text: "자세히 보기",
    className: ["primary", "detail"]
  });
  if (!rate) return;
  const logoSearchContainer = $(".logo-search-container", header);
  logoSearchContainer.appendChild(searchBar);
  const topRateMovie = $(".top-rated-movie", header);
  topRateMovie.prepend(rate);
  topRateMovie.appendChild(button);
  const logo = $(".logo", header);
  logo.addEventListener("click", () => location.reload());
  return header;
};
const Caption = ({ title }) => {
  const caption = document.createElement("h2");
  caption.setAttribute("id", "caption");
  caption.innerText = title;
  return caption;
};
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";
const FAIL_TO_LOAD_MOVIES = "영화 목록을 가져오지 못했습니다.";
const CAPTION = "지금 인기 있는 영화";
addEventListener("load", async () => {
  const app = $("#app");
  if (!app) return;
  const movieList = document.createElement("ul");
  movieList.classList.add("thumbnail-list");
  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "wrap");
  const initialHeader = Header({
    title: "로딩중 ...",
    imageUrl: "",
    voteAverage: 0
  });
  if (!initialHeader) return;
  wrapper.appendChild(initialHeader);
  app.appendChild(wrapper);
  renderMovieContainer(wrapper, movieList);
  updateMovieContainer(wrapper, initialHeader);
  const footer = Footer();
  app.appendChild(footer);
  window.addEventListener("scroll", onScroll);
});
const onScroll = async () => {
  const mode = movieState.getMode();
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight && movieState.getCurrentPage() < movieState.getMaxPage()) {
    await loadMoreMovies(mode);
  }
};
const renderMovieContainer = (wrapper, movieList) => {
  wrapper.appendChild(Caption({ title: CAPTION }));
  wrapper.appendChild(movieList);
  for (let i = 0; i < 20; i++) {
    const skeletonItem = SkeletonMovieItem();
    movieList.appendChild(skeletonItem);
  }
  wrapper.appendChild(movieList);
};
const updateMovieContainer = async (wrapper, initialHeader) => {
  movieState.setMode("popular");
  try {
    const movies = await fetchPopularMovieList(
      movieState.getCurrentPage()
    );
    movieState.setMaxPage(movies.total_pages);
    updateTopMovieInfo(movies, wrapper, initialHeader);
    loadMovies(movies);
  } catch (error) {
    wrapper.appendChild(NoSearchResults(FAIL_TO_LOAD_MOVIES));
  }
};
const loadMoreMovies = async (mode) => {
  movieState.increasePage();
  const currentPage2 = movieState.getCurrentPage();
  let movies;
  if (mode === "popular") {
    movies = await fetchPopularMovieList(currentPage2);
  } else if (mode === "search") {
    const keyword = movieState.getSearchKeyword();
    movies = await fetchSearchMovieList(keyword, currentPage2);
  }
  if (movies) {
    loadMovies(movies);
  }
};
const updateTopMovieInfo = (movies, wrapper, initialHeader) => {
  const topMovie = movies.results[0];
  if (topMovie) {
    const updatedHeader = Header({
      title: topMovie.title,
      imageUrl: `${IMG_BASE_URL}${topMovie.poster_path}`,
      voteAverage: topMovie.vote_average
    });
    if (updatedHeader && initialHeader)
      wrapper.replaceChild(updatedHeader, initialHeader);
  }
};
