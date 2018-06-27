import React from 'react'
import Button from '../Button'
import GitHub from 'github-api'
import githubBrowser from '@mapbox/github-file-browser'

class GitHubSection extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      github: new GitHub({
        token: window.localStorage.getItem("github_access_token")
      })
    };
    this.tileserverGlUrl = 'https://tileserver.dev.bgdi.ch';
    this.OAUTH_CLIENT_ID = 'fea7cb6d19029efce200';
    this.checkGitHubAuth();
    this.githubTree = React.createRef();
  }

  githubLogin() {
    // Go and login.
    // micro-github
    //window.location.pathname = "/auth/github/login";
     
    // gatekeeper
    if (this.OAUTH_CLIENT_ID) {
      window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + 
          this.OAUTH_CLIENT_ID + '&scope=repo';
    }
  }

  checkGitHubAuth() {
    console.log("CHECK AUTH")
    this.state.github.getUser().getProfile()
      .then(() => {
        console.log(">> AUTH");
        this.setState({
          githubAuthState: "authenticated"
        })
      })
      .catch((err) => {
        console.log(">> NO AUTH", err);
        this.setState({
          githubAuthState: "unauthenticated"
        })
      })
  }

  save(d) {
    const last = d[d.length - 1];
    const pathparts = d.slice(3);
     
    // Save a new style
    if (last.type === 'new')  {
      const styleName = prompt('New style name');
      if (!styleName) {
        return;
      }
      // Get the style file path
      let filePath;
      if (/\.json$/i.test(styleName)) { // The style name is already a path to a file
        filePath = styleName;
      } 
      else { // The style name is a folder
        filePath = styleName + '/style.json';
      }
      pathparts.pop();
      pathparts.push({
        path: filePath
      });
    }
  
    // Create/update a file
    const commitMsg = prompt('Commit message');
    if (!commitMsg) {
      return;
    }
    // Makes the style useable by tileserver-gl
    const mapStyle = this.transformForTileserverGl(this.props.mapStyle);
    const content = JSON.stringify(mapStyle, null, 2);
    const path = pathparts.map(function(p) {
      return p.path;
    }).join('/');

    this.state.github
      .getRepo(d[0].login, d[1].name)
      .writeFile(d[2].name, path, content, commitMsg, {})
      .then(() => {}, (err) => {
          console.error(err); 
      });
  }

  load(d) {
    const last = d[d.length - 1];

    // Get a file
    if (!last.path) {
      return console.error('Last is invalid: ' + JSON.stringify(last));
    }

    if (!last.path.match(/\.json$/i)) {
      return alert('Only JSON files are supported from GitHub');
    }

    if (last.type === 'blob') {
      var that = this;

      this.state.github
        .getRepo(d[0].login, d[1].name)
        .getBlob(last.sha)
        .then((resp) => {
          // Get the path to the file
          const pathparts = d.slice(3);
          pathparts.pop();
          const path = pathparts.map(function(p) {
            return p.path;
          }).join('/');
          const data = that.transformForMaputnik(resp.data, path);
          that.props.onStyleOpen(data);
        }, (err) => {
          console.error(err); 
        });
    }
  }

  transformForTileserverGl(mapStyle) {
    
    if (!this.tileserverGlUrl) {
      return mapStyle;
    }
    
    // Fast way to clone an object
    const style = JSON.parse(JSON.stringify(mapStyle)); 
    const regex = new RegExp('^' + this.tileserverGlUrl);
    const regexData = new RegExp('^' + this.tileserverGlUrl + '/data/(.*).json');
    
    if (regex.test(style.sprite)) {
      style.sprite = '{styleJsonFolder}/sprite';
    }
    
    if (regex.test(style.glyphs)) {
      style.glyphs = '{fontstack}/{range}.pbf';     
    }
   
    for (let val of Object.values(style.sources)) {
      let matches = val.url.match(regexData);
      if (matches && matches[1]) {
        val.url = 'mbtiles://{' + matches[1] + '}';
      } else if (regex.test(val.url)) {
        val.url = val.url.replace(this.tileserverGlUrl, 'local:/');
      }
    }  

    return style;
  }
  
  transformForMaputnik(mapStyle, path) {
    
    if (!this.tileserverGlUrl) {
      return mapStyle;
    }
    
    // Fast way to clone an object
    const style = JSON.parse(JSON.stringify(mapStyle)); 
    
    if ('{styleJsonFolder}/sprite' === style.sprite) {
      style.sprite = this.tileserverGlUrl + '/' + path + '/sprite';
    }
    
    if ('{fontstack}/{range}.pbf' === style.glyphs) {
      style.glyphs = this.tileserverGlUrl + '/fonts/{fontstack}/{range}.pbf';     
    }
   
    for (let val of Object.values(style.sources)) {
      let matches = val.url.match(/^mbtiles:\/\/\{(.*)\}/);
      if (matches && matches[1]) {
        val.url = this.tileserverGlUrl + '/data/' + matches[1] + '.json'
      }

      if (/^local:\/\//.test(val.url)) {
        val.url = val.url.replace('local:/', this.tileserverGlUrl);
      }
    }  
    return style;
  }

  onClick(d) {

    if (!d || !d.length) {
      return;
    }
    
    if (this.props.allowFileCreation) {
      this.save(d); 
    }
    else {
      this.load(d);  
    }
  }

  componentDidMount() {
    const that = this;
    const token = window.localStorage.getItem("github_access_token");
    const githubApiUrl = 'https://api.github.com'; 
    githubBrowser(token, this.props.allowFileCreation, githubApiUrl)
      .open()
      .onclick(function(d) {
        that.onClick(d);
      })
      .appendTo(this.githubTree.current);
  }

  render() {
    let content;

    console.log("DEBUG", this.state)
    if (this.state.githubAuthState === "authenticated") {
      content = (
        <div></div>
      )
    }
    else if (this.state.githubAuthState === "unauthenticated") {
      content = (
        <div key="github-upload">
          <Button className="maputnik-upload-button" onClick={() => this.githubLogin()}>
            Login with GitHub
          </Button>
        </div>
      )
    }
    else {
      content = (
        <div key="github-loading">LOADING...</div>
      )
    }

    return (
      <div>
        <div ref={this.githubTree}></div>
        {content}
      </div>
    )
  }
}

export default GitHubSection
