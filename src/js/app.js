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
        <div class='repo-name'>
          <a href='${repo.url}'>${repo.name}</a>
        <div/>
        <div class='description'>${repo.description}</div>

        <span class='language' style='background-color:  ${repo.languages.edges[0].node.color};'></span>
        <span>${repo.languages.edges[0].node.name}</span>
        <span>${repo.stargazerCount}</span>
        <span>${repo.forks.totalCount}</span>
        <span>Updated at ${new Date(repo.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
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
