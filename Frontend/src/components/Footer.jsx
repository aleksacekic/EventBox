import React from 'react'

function Footer() {
  return (
    <div>
      <div className="tags-sec full-width">
        <ul>
          <li><a href="#">Help Center</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Community Guidelines</a></li>
          <li><a href="#">Cookies Policy</a></li>
          <li><a href="#">Language</a></li>
          <li><a href="#">Copyright Policy</a></li>
        </ul>
        <div className="cp-sec">
        <p><img src="images/copy-icon2.png" />Copyright 2023</p>
              <img className="fl-rgt slikafooter" src="images/eb-logo-dugi2.png" />
        </div>
      </div>{/*tags-sec end*/}
    </div>
  )
}

export default Footer