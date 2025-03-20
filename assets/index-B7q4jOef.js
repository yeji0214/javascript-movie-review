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
const Rate = ({ rate, className }) => {
  const rateElement = createElement(
    /*html*/
    `
    <div class="rate">
        <img src="./images/star_empty.png" class="star" />
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
const MovieItem = ({ src, rate, title }) => {
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
  return movieItem;
};
const loadMovies = async (movies) => {
  movies.results.forEach((movie) => {
    const posterPath = movie.poster_path;
    const movieElement = MovieItem({
      src: posterPath ? `https://image.tmdb.org/t/p/w440_and_h660_face/${movie.poster_path}` : "./images/default_poster.png",
      title: movie.title,
      rate: movie.vote_average
    });
    $(".thumbnail-list").appendChild(movieElement);
  });
  if (movies.page === movies.total_pages)
    $(".load-more").classList.add("hidden");
};
const LoadMoreButton = ({ loadFn }) => {
  let currentPage2 = 1;
  const loadMoreButton = Button({ text: "더보기", className: ["load-more"] });
  loadMoreButton.addEventListener("click", async () => {
    currentPage2++;
    const movies = await loadFn(currentPage2);
    loadMovies(movies);
  });
  return loadMoreButton;
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
  $(".thumbnail-list").replaceChildren();
  $(".load-more").remove();
  $("#caption").innerText = `"${input}" 검색 결과`;
  try {
    const movies = await fetchSearchMovieList(input, 1);
    $(".top-rated-container").classList.add("hidden");
    $(".overlay-img").classList.add("hidden");
    if (movies.results.length === 0) {
      $(".thumbnail-list").after(NoSearchResults("검색 결과가 없습니다."));
      return;
    }
    loadMovies(movies);
    $(".thumbnail-list").after(
      LoadMoreButton({
        loadFn: (currentPage2) => fetchSearchMovieList(input, currentPage2)
      })
    );
  } catch (error) {
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
let currentPage = 1;
const movieList = document.createElement("ul");
movieList.classList.add("thumbnail-list");
const wrapper = document.createElement("div");
wrapper.setAttribute("id", "wrap");
addEventListener("load", async () => {
  const app = $("#app");
  const header = Header({ title: "로딩중 ...", imageUrl: "", voteAverage: 0 });
  if (!header) return;
  const footer = Footer();
  if (app) {
    app.appendChild(wrapper);
    wrapper.appendChild(header);
    wrapper.appendChild(Caption({ title: "지금 인기 있는 영화" }));
    wrapper.appendChild(movieList);
    for (let i = 0; i < 20; i++) {
      const skeletonItem = SkeletonMovieItem();
      movieList.appendChild(skeletonItem);
    }
    wrapper.appendChild(movieList);
    try {
      const movies = await fetchPopularMovieList(currentPage);
      const topMovie = movies.results[0];
      if (topMovie) {
        const updatedHeader = Header({
          title: topMovie.title,
          imageUrl: `https://image.tmdb.org/t/p/w500${topMovie.poster_path}`,
          voteAverage: topMovie.vote_average
        });
        if (updatedHeader) wrapper.replaceChild(updatedHeader, header);
      }
      loadMovies(movies);
      wrapper.appendChild(
        LoadMoreButton({
          loadFn: fetchPopularMovieList
        })
      );
    } catch (error) {
      wrapper.appendChild(NoSearchResults("영화 목록을 가져오지 못했습니다."));
    }
    app.appendChild(footer);
  }
});
