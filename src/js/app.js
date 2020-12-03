const { GITHUB_TOKEN } = require('./api');

const model = {
  data: null,
  getRepos() {
    if (!this.data) {
      return null;
    }
    return this.data.user.repositories.edges.map((item) => item.node);
  },

  getRepoCount() {
    return this.data.user.repositories.totalCount;
  },

  getUser() {
    if (!this.data) {
      return null;
    }
    const {
      avatarUrl,
      bio,
      login,
      name,
      status: { emoji, emojiHTML },
    } = this.data.user;

    return {
      avatarUrl,
      bio,
      login,
      name,
      emoji,
      emojiHTML,
    };
  },

  init() {
    const query = `query MyQuery {
      user(login: "tolulawson") {
        avatarUrl
        name
        bio
        login
        status {
          emoji
          emojiHTML
        }
        repositories(orderBy: {field: CREATED_AT, direction: DESC}, first: 20) {
          edges {
            node {
              name
              languages(orderBy: {field: SIZE, direction: DESC}, first: 1) {
                edges {
                  node {
                    name
                    color
                  }
                }
              }
              description
              stargazerCount
              forks {
                totalCount
              }
              updatedAt
              id
              url
            }
          }
          totalCount
        }
      }
    }
    `;
    return new Promise((resolve) => {
      fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({ query }),
      })
        .then((r) => r.json())
        .then((data) => {
          this.data = data.data;
          resolve();
        });
    });
  },
};

const userView = {
  element: document.createElement('div'),
  root: document.getElementById('user'),
  render() {
    const userData = model.getUser();
    this.element.innerHTML = `
      <div class='avatar' id='avatar'>
        <a href='#'>
          <img src='${userData.avatarUrl}' alt='Profile picture' class='avatar-img' height=260 width=260/>
        </a>
        ${userData.emojiHTML}
      </div>
      <div id='user-top'></div>
      <div class='user-info' id='user-info'>
        <div class='name' id='name'>${userData.name}</div>
        <div class='login' id='login'>${userData.login}</div>
      </div>
      <div class='bio'>${userData.bio}</div>
    `;
    this.root.append(this.element);
    document.getElementById('status-image').src = userData.avatarUrl;
    document.querySelector('.tab-nav-img').src = userData.avatarUrl;

    // -- sticky avatar
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].intersectionRatio === 0) {
        document.querySelector('.tab-nav').classList.remove('sticky');
        document.querySelector('.user-info').classList.add('sticky');
        document.querySelector('.avatar').classList.add('sticky');
      } else if (entries[0].intersectionRatio === 1) {
        document.querySelector('.tab-nav').classList.add('sticky');
        document.querySelector('.user-info').classList.remove('sticky');
        document.querySelector('.avatar').classList.remove('sticky');
      }
    }, {
      threshold: [0, 1],
    });
    observer.observe(document.querySelector('#user-top'));
  },
};

const reposView = {
  element: document.createElement('ul'),
  root: document.getElementById('repos'),
  render() {
    const repos = model.getRepos();
    repos.forEach((repo) => {
      const singleRepo = document.createElement('li');
      singleRepo.innerHTML = `
        <h3 class='repo-name'>
          <a href='${repo.url}'>${repo.name}</a>
        <h3/>
        <div class='description'>${repo.description}</div>

        <div class='meta'>
          <span class='language meta-item'>
            <span class='language-color' style='background-color:  ${repo.languages.edges[0].node.color};'></span>
            <span class='language-text'>${repo.languages.edges[0].node.name}</span>
          </span>
          <span class='meta-item' style='display: ${repo.stargazerCount > 0 ? '' : 'none'};'>
            <svg viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img" style="outline: none;"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z" style="outline: none;"></path></svg>
            ${repo.stargazerCount}
          </span>
          <span class='meta-item' style='display: ${repo.forks.totalCount > 0 ? '' : 'none'};'>
            <svg viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img" style="outline: none;"><path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" style="outline: none;"></path></svg>
            ${repo.forks.totalCount}
          </span>
          <span class='meta-item'>Updated on ${new Date(repo.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
      `;
      this.element.append(singleRepo);
    });
    this.root.append(this.element);
    document.querySelector('.counter').textContent = model.getRepoCount();
  },
};

const controller = {
  init() {
    model.init()
      .then(() => {
        userView.render();
        reposView.render();
      });
  },
};

window.addEventListener('load', () => {
  controller.init();
});
