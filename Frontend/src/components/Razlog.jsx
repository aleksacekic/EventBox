import React from 'react';

function Razlog({jedan_dog}) {
  return (
    <div>
      <div className="comment-sec">
        <ul>
          <li>
          {jedan_dog.razlozi.map(jedan_razlog => {
                return (
            <div className="comment-list">
            <div className="comment">
              <h3>{jedan_razlog.razlog_prijave}</h3>
              <p>{jedan_razlog.opis}</p>
            </div>
            </div>
                 )
            })}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Razlog;