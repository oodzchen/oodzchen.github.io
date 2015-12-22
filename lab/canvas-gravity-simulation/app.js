/*
 * https://github.com/oodzchen
 * Copyright 2015, Lin Chen
 * licensed under the MIT License
 */

;(function(window){
  var $ = document.querySelector.bind(document);
  var canvas = $('#canvas');
  var count = $('#count');
  var gravityInput = $('#gravity');
  var horAcceInput = $('#horAcceleration');
  var ctx = canvas.getContext('2d');
  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.msRequestAnimationFrame ||
                              window.oRequestAnimationFrame;

  var cancelAnimationFrame =  window.cancelAnimationFrame ||
                              window.webkitCancelAnimationFrame ||
                              window.mozCancelAnimationFrame ||
                              window.msCancelRequestAnimationFrame ||
                              window.oCancelAnimationFrame;

  var ball, mainRaf;
  var balls = [];
  var canvasLeft = canvas.offsetLeft + getCss(canvas, 'border-left-width');
  var canvasTop = canvas.offsetTop + getCss(canvas, 'border-top-width');
  var WALLRESISTANCE = 0.05; // 墙壁碰撞减速度
  var GRAVITY = 0.5; // 重力加速度
  var HORIZONRESISTANCE = -0.005; // 水平减速度
  var LIMIT = Infinity; // 小球数量限制

  // pollyfill for CustomEvent, https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
  (function () {
    function CustomEvent ( event, params ) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent( 'CustomEvent' );
      evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
      return evt;
     }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
  })();

  function Ball(options){
    var defaults = {
      x: 0,
      y: 0,
      xv: 0,
      yv: 0,
      xa: HORIZONRESISTANCE,
      ya: GRAVITY,
      color: '#324359',
      radius: 50
    };

    var config = extend(defaults, options);

    this.x = config.x;
    this.y = config.y;
    this.xv = config.xv;
    this.yv = config.yv;
    this.xa = config.xa;
    this.ya = config.ya;
    this.color = config.color;
    this.radius = config.radius;

    this.moving = false;
  }

  Ball.prototype.draw = function(){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  };

  Ball.prototype.startMove = function(){
    var self = this;

    if(this.moving) return;

    this.moving = true;
    move();

    function move(){

      if(self.x < self.radius || self.x > canvas.width - self.radius){

        self.xv = -Math.abs(self.xv)/self.xv*(Math.abs(self.xv) - WALLRESISTANCE);
        self.xa = -self.xa;
        self.x = self.x < self.radius ? self.radius : (canvas.width - self.radius);

      }

      if(Math.abs(self.xv) <= Math.abs(self.xa)){
        self.xv = 0;
      }

      if(self.y > canvas.height - self.radius){

        if(Math.abs(self.yv) <= Math.abs(self.ya) && self.xv == 0){
          self.yv = 0;
          self.stopMove();
          return;

        }else{
          self.yv = -Math.abs(self.yv)/self.yv*(Math.abs(self.yv) - WALLRESISTANCE);

          canvas.dispatchEvent(new CustomEvent('crash', {
            detail: self
          }));

        }

        self.y = canvas.height - self.radius;

      }

      self.xv += self.xa;
      self.x += self.xv;
      self.yv += self.ya;
      self.y += self.yv;
      
      self.moveRaf = requestAnimationFrame(move);
    }
  };

  Ball.prototype.stopMove = function(){
    this.moving = false;
    cancelAnimationFrame(this.moveRaf);
  };

  Ball.prototype.reset = function(){
    this.xv = 0;
    this.yv = 0;
  };

  function paint(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ball.draw();
    balls.forEach(function(obj){
      obj.draw();
    });
    mainRaf = requestAnimationFrame(paint);
  }

  function start(){
    paint();
  }

  function end(){
    return cancelAnimationFrame(mainRaf);
  }

  function extend(target, obj){
    var target = target;
    for(var key in obj){
      if(obj.hasOwnProperty(key)){
        target[key] = obj[key];
      }
    }

    return target;
  }

  function getCss(element, cssProp){
    var cssObj = window.getComputedStyle(element);
    var val = cssObj[cssProp];

    if(cssProp.match(/(height|width|left|top)$/i)){
      val = Number(val.replace(/px$/, ''));
      return window.isNaN(val) ? 0 : val;
    }else{
      return val;
    }
  }

  function getRandColor(){
    var arr = [];

    while(arr.length < 3){
      arr.push(Math.floor(Math.random()*255));
    }

    return 'rgb(' + arr.join(', ') + ')';
  }

  function init(){
    canvas.width = 1000;
    canvas.height = 800;
    gravityInput.value = GRAVITY*100;
    gravityInput.nextSibling.textContent = GRAVITY;
    horAcceInput.value = Number(horAcceInput.min) + Number(horAcceInput.max) - HORIZONRESISTANCE*1000;
    horAcceInput.nextSibling.textContent = HORIZONRESISTANCE;

    ball = new Ball({
      x: 150,
      y: 750,
      xv: 0,
      yv: 0,
      xa: HORIZONRESISTANCE,
      ya: GRAVITY
    });

    start();

    loadEvents();
  }

  function loadEvents(){

    gravityInput.addEventListener('input', onGravityInput, false);
    gravityInput.addEventListener('change', onGravityInput, false);
    horAcceInput.addEventListener('input', onHorAcceInput, false);
    horAcceInput.addEventListener('change', onHorAcceInput, false);

    canvas.addEventListener('mousedown', onCanvasMouseDown, false);
    canvas.addEventListener('crash', onCanvasBallCrash, false);

  }

  function onGravityInput(e){
    this.nextSibling.textContent = GRAVITY = this.value/100;
    ball.ya = GRAVITY;
    balls.forEach(function(obj){
      obj.ya = GRAVITY;
    });
  }

  function onHorAcceInput(e){
    this.nextSibling.textContent = HORIZONRESISTANCE = -(Number(this.min) + Number(this.max) - this.value)/1000;
    console.log(HORIZONRESISTANCE);
    var _xa = ball.xv == 0 ? ball.xa : -Math.abs(ball.xv)/ball.xv*Math.abs(HORIZONRESISTANCE);
    ball.xa = _xa;
    balls.forEach(function(obj){
      obj.xa = _xa;
    });
  }

  function onCanvasMouseDown(e){
    var x = e.pageX - canvasLeft;
    var y = e.pageY - canvasTop;
    var distX = ball.x - x;
    var distY = ball.y - y;
    var startX = x;
    var startY = y;
    var speedX = speedY = 0;

    e.preventDefault();
    e.stopPropagation();

    if(Math.abs(ball.x-x) < ball.radius && Math.abs(ball.y-y) < ball.radius){

      if(ball.moving){
        ball.stopMove();
        ball.reset();
      }

      canvas.addEventListener('mousemove', onCanvasMouseMove, false);
      canvas.addEventListener('mouseup', onCanvasMouseUp, false);
      canvas.addEventListener('mouseleave', onCanvasMouseLeave, false);
    }else{
      canvas.addEventListener('mousemove', onCanvasCreateBalls, false);
      canvas.addEventListener('mouseup', onCanvasCreateEnd, false);
      canvas.addEventListener('mouseleave', onCanvasCreateLeave, false);
    }

    function onCanvasMouseMove(e){
      var x = e.pageX - canvasLeft;
      var y = e.pageY - canvasTop;
      speedX = x - startX;
      speedY = y - startY;

      startX = x;
      startY = y;

      e.preventDefault();

      ball.x = x + distX;
      ball.y = y + distY;

      if(ball.x > canvas.width - ball.radius){
        ball.x = canvas.width - ball.radius;
      }

      if(ball.x < ball.radius){
        ball.x = ball.radius;
      }

      if(ball.y > canvas.height - ball.radius){
        ball.y = canvas.height - ball.radius;
      }
    }

    function onCanvasMouseUp(e){
      console.log(speedX, speedY);

      ball.xv = speedX;
      ball.yv = speedY;
      ball.xa = speedX == 0 ? ball.xa : -(Math.abs(ball.xv)/ball.xv*Math.abs(ball.xa)); // 水平方向保持减速运动
      ball.startMove();

      canvas.removeEventListener('mousemove', onCanvasMouseMove, false);
      canvas.removeEventListener('mouseleave', onCanvasMouseLeave, false);
      canvas.removeEventListener('mouseup', onCanvasMouseUp, false);
    }

    function onCanvasMouseLeave(e){
      ball.reset();
      ball.startMove();

      canvas.removeEventListener('mousemove', onCanvasMouseMove, false);
      canvas.removeEventListener('mouseup', onCanvasMouseUp, false);
      canvas.removeEventListener('mouseleave', onCanvasMouseLeave, false);
    }

    function onCanvasCreateBalls(e){
      var x = e.pageX - canvasLeft;
      var y = e.pageY - canvasTop;

      var speedX = (Math.random()-0.5)*16;
      var speedY = (Math.random()-0.5)*16;

      var ball = new Ball({
        radius: 5,
        color: getRandColor(),
        x: x,
        y: y,
        xv: speedX,
        yv: speedY,
        xa: speedX == 0 ? HORIZONRESISTANCE : -(Math.abs(speedX)/speedX*Math.abs(HORIZONRESISTANCE))
      });

      ball.startMove();
      balls.push(ball);
      count.textContent = balls.length;

      if(balls.length >= LIMIT){
        balls.splice(0, 1)[0].stopMove();
      }

      e.preventDefault();
    }

    function onCanvasCreateEnd(e){
      canvas.removeEventListener('mousemove', onCanvasCreateBalls, false);
      canvas.removeEventListener('mouseleave', onCanvasCreateLeave, false);
      canvas.removeEventListener('mouseup', onCanvasCreateEnd, false);
    }

    function onCanvasCreateLeave(e){
      canvas.removeEventListener('mousemove', onCanvasCreateBalls, false);
      canvas.removeEventListener('mouseup', onCanvasCreateEnd, false);
      canvas.removeEventListener('mouseleave', onCanvasCreateLeave, false);
    }

  }

  function onCanvasBallCrash(e){
    if(e.detail !== ball) return;

    var crashX = ball.x;
    var crashXV = ball.xv;
    var crashYV = ball.yv;
    var len = balls.length;
    var crashRadius = 25;
    var i, len, temp;

    for(i = 0; i < len; i++){
      temp = balls[i];

      if(temp.moving == false && temp.x > crashX - crashRadius && temp.x < crashX + crashRadius){

        temp.xv = Math.abs(temp.x - crashX) < 5 ? 0 : (Math.abs(crashXV)+Math.abs(crashYV))*crashRadius/(temp.x - crashX)/8;
        temp.yv = Math.abs(temp.x - crashX) < 5 ? 0 : -crashYV*crashRadius/Math.abs(temp.x - crashX)/2;
        temp.xa = temp.xv == 0 ? temp.xa : -(Math.abs(temp.xv)/temp.xv*Math.abs(temp.xa));
        temp.startMove();
      }
    }
  }

  init();
})(global)