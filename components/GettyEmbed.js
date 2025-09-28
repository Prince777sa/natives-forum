// components/GettyEmbed.js
import { useEffect } from 'react';

export default function GettyEmbed() {
  useEffect(() => {
    // Load Getty widget script if not already loaded
    if (!window.gie) {
      const script = document.createElement('script');
      script.src = '//embed-cdn.gettyimages.com/widgets.js';
      script.charset = 'utf-8';
      script.async = true;
      document.head.appendChild(script);
    }

    // Initialize the widget
    window.gie = window.gie || function(c) { (gie.q = gie.q || []).push(c) };
    window.gie(function() {
      gie.widgets.load({
        id: 'xpvjp2HhTAVVSSvSPa0eVg',
        sig: 'tw6XQTMuK5CPq25iUYogy_rnbb1_xGhlK4bDuL5jH0I=',
        w: '592px',
        h: '594px',
        items: '2664162',
        caption: true,
        tld: 'com',
        is360: false
      });
    });
  }, []);

  return (
    <a 
      id='xpvjp2HhTAVVSSvSPa0eVg' 
      className='gie-single' 
      href='http://www.gettyimages.com/detail/2664162' 
      target='_blank' 
      style={{
        color: '#a7a7a7',
        textDecoration: 'none',
        fontWeight: 'normal !important',
        border: 'none',
        display: 'inline-block'
      }}
    >
      Embed from Getty Images
    </a>
  );
}