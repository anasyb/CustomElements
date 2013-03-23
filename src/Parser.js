/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {

// TODO(sjmiles): ShadowDOM polyfill pollution
var sdocument = window.wrap ? wrap(document) : document;

// highlander object for parsing a document tree

var componentParser = {
  selectors: [
    'link[rel=component]',
    'link[rel=stylesheet]',
    'script[src]',
    'script',
    'style',
    'element'
  ],
  map: {
    link: 'parseLink',
    script: 'parseScript',
    element: 'parseElement',
    style: 'parseStyle'
  },
  parse: function(inDocument) {
    if (inDocument) {
      // upgrade everything
      document.upgradeElements(inDocument);
      // all parsable elements in inDocument (depth-first pre-order traversal)
      var elts = inDocument.querySelectorAll(cp.selectors);
      // for each parsable node type in inDocument, call the parsing method
      // to it's local name
      forEach(elts, function(e) {
        //console.log(map[e.localName] + ":", path.nodeUrl(e));
        cp[cp.map[e.localName]](e);
      });
      // upgrade everything
      document.upgradeElements(inDocument);
    }
  },
  parseLink: function(inLinkElt) {
    // rel=components
    if (this.isDocumentLink(inLinkElt)) {
      cp.parse(inLinkElt.__resource);
    } else {
      // rel=stylesheet
      // inject into main body
    }
  },
  isDocumentLink: function(inElt) {
    return (inElt.localName === 'link'
        && inElt.getAttribute('rel') === 'component');
  },
  parseScript: function(inScriptElt) {
    // ignore scripts in primary document, they are already loaded
    if (inScriptElt.ownerDocument === sdocument) {
      return;
    }
    // ignore scripts inside <element>
    if (inScriptElt.parentNode.localName === 'element') {
      return;
    }
    // otherwise, evaluate now
    var code = inScriptElt.__resource || inScriptElt.textContent;
    if (code) {
      eval(code);
    }
  },
  parseStyle: function(inStyleElt) {
    document.querySelector("head").appendChild(inStyleElt);
  },
  parseElement: function(inElementElt) {
    // TODO(sjmiles): ShadowDOM polyfill pollution
    var element = /*window.wrap ? wrap(inElementElt) :*/ inElementElt;
    new HTMLElementElement(element);
  }
};

var cp = componentParser;

var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

// bootstrap parsing

function bootstrap() {
  // parse document
  componentParser.parse(document);
  // notify system
  sdocument.body.dispatchEvent(
    new CustomEvent('WebComponentsReady', {bubbles: true})
  );
}

var parseTimeEvent = window.WebComponents ? 'WebComponentsLoaded' : 'load';
sdocument.addEventListener(parseTimeEvent, function() {
  // let call stack unwind
  setTimeout(bootstrap, 0);
});

})();