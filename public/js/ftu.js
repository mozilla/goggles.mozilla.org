var StepHandler = function(element, steps) {
  this.disabled = false;
  this.step = 0;
  this.steps = steps;
  this.element = element;
};

StepHandler.prototype = {
  back: function() {
    var laststep = this.steps[this.step--];
    this.unhookNavigation(laststep);
    this.element.removeChild(laststep);
  },
  next: function() {
    var step = this.steps[++this.step];
    if (!step) return; // should this stop, instead?
    this.element.appendChild(step);
    this.hookNavigation(step);
  },
  stop: function() {
    this.element.innerHTML = "";
    this.step = -1;
  },
  disable: function() {
    this.disabled = true;
    this.element.parentNode.removeChild(this.element);
  },
  hookNavigation: function(el) {
    var back = el.querySelector('.back');
    if (back) {
      var handler = function() {
        this.back();
      }.bind(this);
      back.addEventListener("click", handler);
      el._backHandler = handler;
    }
    var skip = el.querySelector('.skip');
    if (skip) {
      var handler = function() {
        this.next();
      }.bind(this);
      if (el.classList.contains("skip-2")) {
        handler = function() {
          this.next();
          this.next();
        }.bind(this);
      }
      skip.addEventListener("click", handler);
      el._skipHandler = handler;
    }
    var end = el.querySelector('.end');
    if (end) {
      end.addEventListener("click", this.stop.bind(this));
    }

    var arrow = document.createElement("span");
    arrow.setAttribute("class","arrow");
    el.appendChild(arrow);
  },
  unhookNavigation: function(el) {
    var back = el.querySelector('.back');
    if (back) { back.removeEventListener("click", el._backHandler); }
    var skip = el.querySelector('.skip');
    if (skip) { skip.removeEventListener("click", el._skipHandler); }
  },
  init: function() {
    this._wmh = this.messageHandler.bind(this);
    window.addEventListener("message", this._wmh);
    this.start();
  },
  messageHandler: function(evt) {
    var data = evt.data;
    if(!data || data.indexOf('{') > -1) return;

    // reset to the beginning if someone (accidentally) closes the goggles
    if (data === "goggles-end") {
      return this.start();
    }

    // move on if a goggles event matches the trigger required to complete the current step
    var classList = this.element.querySelector(".step:last-child").classList;
    if (classList.contains(data)) {
      return this.next();
    }

    if(classList.contains("end")) {
      window.removeEventListener("message", this._wmh);
      this._wmh = false;
      this.stop();
    }
  },
  start: function() {
    this.element.innerHTML = "";
    this.step = -1;
    this.next();
  }
};

var dialog = document.querySelector(".dialoger")
var steps = document.querySelectorAll(".steps .step");
var stepHandler = new StepHandler(dialog, steps);

function removeOverlay() {
  var o = document.querySelector(".instruction-overlay");
  o.parentNode.removeChild(o);
}


window.addEventListener("message", function listenForGoggles(evt) {
  if (evt.data === "goggles-start") {
    removeOverlay();
    stepHandler.init();
  }
});

/*
document.querySelector(".instruction-overlay").addEventListener("click", function(evt) {
  removeOverlay();
});
*/

var closers = document.querySelectorAll("span.dismiss-link, div.close, button.browse");
Array.prototype.forEach.call(closers, function(e) {
  e.addEventListener("click", function(evt) {
    removeOverlay();
  });
});
