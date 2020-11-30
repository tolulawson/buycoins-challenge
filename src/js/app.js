const { GITHUB_TOKEN } = require('./api');

console.log(GITHUB_TOKEN);

const model = {
  data: null,
  root: document.getElementById('root'),
  getRepos() {
    if (!this.data) {
      return null;
    }
    return this.data.user.repositories.edges.map((item) => item.node);
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
        repositories(orderBy: {field: CREATED_AT, direction: DESC}, first: 10) {
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
              stargazerCount
              forks {
                totalCount
              }
              updatedAt
              id
            }
          }
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
          Authorization: `Bearer ${!process.env.GITHUB_TOKEN ? GITHUB_TOKEN : process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({ query }),
      })
        .then((r) => r.json())
        .then((data) => {
          this.data = data.data;
          console.log(model.getRepos()); 
          resolve();
        });
    });
  },
};

const userView = {
  element: document.createElement('div'),
  render() {
    const userData = model.getUser();
    this.element.innerHTML = `
      <img src='${userData.avatarUrl}' alt='Profile picture' class='avatar'/>
      ${userData.emojiHTML}
      <div class='name'>${userData.name}</div>
      <div class='login'>${userData.login}</div>
      <div class='bio'>${userData.bio}</div>
    `;
    model.root.append(this.element);
  },
};

const reposView = {
  element: document.createElement('div'),
  render() {
    const repos = model.getRepos();
    repos.forEach((repo) => {
      const singleRepo = document.createElement('div');
      singleRepo.innerHTML = `
        <div>${repo.name}</div>
      `;
      this.element.append(singleRepo);
    });
    model.root.append(this.element);
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
