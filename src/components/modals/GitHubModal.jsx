import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import GitHubSection from './GitHubSection'
import GitHub from 'github-api'
import Button from '../Button'

import * as styleSpec from '@mapbox/mapbox-gl-style-spec/style-spec'
import githubBrowser from '@mapbox/github-file-browser'

class GitHubModal extends React.Component {
  static propTypes = {
    mapStyle: PropTypes.object.isRequired,
    onStyleChanged: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onOpenToggle: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <Modal data-wd-key="github-modal"
             isOpen={this.props.isOpen}
             onOpenToggle={this.props.onOpenToggle}
             title={'Save to GitHub'}>
        <div className="maputnik-modal-section">
          <GitHubSection allowFileCreation={true} mapStyle={this.props.mapStyle}/>
        </div>
      </Modal>
    )
  }
}

export default GitHubModal
