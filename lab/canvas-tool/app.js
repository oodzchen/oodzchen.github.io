/*
 * by Lin Chen https://github.com/oodzchen
 * created at 2015.11.5
 * All Rights Reserved
 */

;(function(window){
  'use strict';

  var $ = document.querySelector.bind(document);
  var bgInput = $('#bgInput');
  var fileInput = $('#fileInput');
  var canvas = $('#canvas');
  var results = $('#results');
  var undoBtn = $('#undo');
  var heightInput = $('#boardHeight');
  var widthInput = $('#boardWidth');
  var ctx = canvas.getContext('2d');
  var forRetina = $('#forRetina');
  var boardWidth = 1024;
  var boardHeight = 748;
  var startPoint = false;

  var boardLeft = canvas.offsetLeft + getStyle(canvas, 'border-left-width');
  var boardTop = canvas.offsetTop + getStyle(canvas, 'border-top-width');

  var slice = Array.prototype.slice;

  var bgImg = null; // 背景图
  var imageDataX = null;
  var imageDataY = null;
  var prevLeft = 0;
  var prevTop = 0; // 打点辅助线数据
  var imgObjArr = []; // 存放拖拽图片数据
  var pointsResult = []; // 已打印的点的中心位置集合
  var pointsDataArr = []; // 已打印的圆点的数据

  init();

  function init(){
    canvas.width = boardWidth;
    canvas.height = boardHeight;
    results.style.height = boardHeight + 'px';
    results.value = '';
    forRetina.checked = false;
    widthInput.value = boardWidth;
    heightInput.value = boardHeight;

    setOpacityBackground();

    loadEvents();
  }

  function loadEvents(){
    $('#setBg').addEventListener('click', onSetBackgroundClick, false);
    $('#open').addEventListener('click', function(e){
      fileInput.click();
    }, false);
    fileInput.addEventListener('change', onFileInputChange, false);

    $('#setSize').addEventListener('click', onSetResizeClick, false);
    $('#setPoint').addEventListener('click', onStartPointClick, false);

    $('#reset').addEventListener('click', function(e){
      reset(true);
    }, false);

    $('#resetPoint').addEventListener('click', function(e){
      removeAllPoints(true);
    }, false);

    $('#resetImgs').addEventListener('click', function(e){
      removeAllImgs(true);
    }, false);

    $('#resetBackground').addEventListener('click', function(){
      bgImg = null;
      setOpacityBackground();
      drawAllImgs(false);
      drawAllPoints();
    }, false);

    results.addEventListener('focus', function(e){
      this.setSelectionRange(0, this.value.length);
    }, false);

    canvas.addEventListener('drop', onCanvasDrop, false);
    canvas.addEventListener('dragover', preventHandler, false);
    canvas.addEventListener('dragleave', preventHandler, false);
    canvas.addEventListener('dragenter', preventHandler, false);

    canvas.addEventListener('mousedown', onCanvasImgMouseDown, false);

    document.addEventListener('keydown', onDocumentKeydown, false);
    document.addEventListener('keyup', onDocumentKeyup, false);
  }

  function onDocumentClick(e){
    if(!startPoint || e.target.id === 'canvas' || e.target.id === 'setPoint' || e.target.id === 'undo') return;
    endPoint();
  }

  function onDocumentKeydown(e){
    console.log(e.keyCode);
    if(e.keyCode < 37 || imgObjArr.length === 0 || moveBgData === null) return;

    var lastImgObj = imgObjArr[imgObjArr.length-1];
    if(!lastImgObj.focused) return;

    var left = 0;
    var top = 0;

    switch(e.keyCode){
      case 37:
        left = lastImgObj.left - 1;
        top = lastImgObj.top;
        break;
      case 38:
        left = lastImgObj.left;
        top = lastImgObj.top - 1;
        break;
      case 39:
        left = lastImgObj.left + 1;
        top = lastImgObj.top;
        break;
      case 40:
        left = lastImgObj.left;
        top = lastImgObj.top + 1;
        break;
      case 46:
        console.log('delete!');
        lastImgObj.blur();
        lastImgObj.remove(true);
        return;
      default:
        left = lastImgObj.left;
        top = lastImgObj.top;
        break;
    }

    lastImgObj.focused = false;
    ctx.clearRect(0, 0, boardWidth, boardHeight);
    ctx.drawImage(moveBgData, 0, 0, moveBgData.width, moveBgData.height);
    lastImgObj.move(left, top);
    lastImgObj.focused = true;
  }

  function onDocumentKeyup(e){
    if(e.keyCode < 37 || e.keyCode > 40 || imgObjArr.length === 0 || moveBgData === null) return;

    var lastImgObj = imgObjArr[imgObjArr.length-1];
    if(!lastImgObj.focused) return;

    reset(false);
    drawAllImgs(false);
    lastImgObj.blur()
    lastImgObj.remove();
    moveBgData = canvasToImg(canvas);
    lastImgObj.drawFromData();
    lastImgObj.focus(true);

    drawAllPoints();
  }

  // 退出打点模式
  function endPoint(){
    fixLines();

    startPoint = false;
    ctx.restore();
    document.body.classList.remove('pointer');
    canvas.removeEventListener('mousemove', onCanvasPointMove, false);
    canvas.removeEventListener('click', onCanvasPointClick, false);
    canvas.removeEventListener('mouseleave', onCanvasPointLeave, false);
    document.removeEventListener('click', onDocumentClick, false);
  }

  function onSetResizeClick(e){
    var height = Number(heightInput.value);
    var width = Number(widthInput.value);

    if( window.isNaN(height) || window.isNaN(width) ){
      alert('请输入数字');
      return;
    }

    if(pointsResult.length > 0 || imgObjArr.length > 0){
      var isRemoveDatas = confirm('是否清空已有数据？');
    }

    boardHeight = height;
    boardWidth = width;
    canvas.height = height;
    canvas.width = width;
    results.style.height = height + 'px';

    reset(isRemoveDatas);
    drawAllImgs(true);
    drawAllPoints();
  }

  function onStartPointClick(e){
    if(startPoint) return;
    startPoint = true;
    ctx.save();
    document.body.classList.add('pointer');
    canvas.addEventListener('mousemove', onCanvasPointMove, false);
    canvas.addEventListener('click', onCanvasPointClick, false);
    canvas.addEventListener('mouseleave', onCanvasPointLeave, false);

    document.addEventListener('click', onDocumentClick, false);
  };

  function onSetBackgroundClick(e){
    if(pointsResult.length > 0 || imgObjArr.length > 0){
      var isRemoveDatas = confirm('是否清空已有数据？');
    }

    bgInput.onchange = function(event){
      getImage(bgInput.files[0], function(img){
        bgImg = img;

        reset(isRemoveDatas);
        drawAllImgs(true);
        drawAllPoints();
      });

      console.log('changed!');
    };
    bgInput.click();
  }

  function setBackground(image){
    if(!image) return;
    ctx.save();
    ctx.globalAlpha = 0.5;
    var drawSize = forRetina.checked + 1;
    ctx.drawImage(image, 0, 0, image.width/drawSize, image.height/drawSize);
    ctx.restore();
  }

  function setOpacityBackground(){

    var horNum = Math.ceil(boardWidth/5);

    ctx.save();
    ctx.clearRect(0, 0, boardWidth, boardHeight);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, boardWidth, boardHeight);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 10;
    ctx.setLineDash([10]);

    ctx.beginPath();

    for(var i = 0; i < horNum; i++){
      ctx.moveTo(-(i%2)*10, i*10+5);
      ctx.lineTo(boardWidth, i*10+5);
    }

    ctx.stroke();

    ctx.restore();

  }

  // 根据上传文件读取图片，异步执行
  function getImage(file, callback){
    if(!window.FileReader){
      alert('当前浏览器不支持 FileReader 对象，请升级到最新浏览器。');
      return;
    }

    var reader = new FileReader();

    reader.onload = function(ev){
      var img = new Image();

      img.onload = function(){
        if(typeof callback === 'function') callback.call(this, img);
      };

      img.src = ev.target.result;
    };

    reader.readAsDataURL(file);
  }

  function createImgObj(file){
    var obj = {};

    obj.image = null;
    obj.left = obj.top = obj.width = obj.height = 0;

    obj.data = null;
    obj.zIndex = 0;

    obj.drawFromFile = function(mouseX, mouseY, callback){
      getImage(file, function(img){
        var _left = mouseX-img.width/2;
        var _top = mouseY-img.height/2;
        var isRetina = forRetina.checked;

        obj.image = img;
        obj.left = _left;
        obj.top = _top;
        obj.width = isRetina ? img.width/2 : img.width;
        obj.height = isRetina ? img.height/2 : img.height;

        obj.updateData(_left, top);
        ctx.drawImage(img, _left, _top, obj.width, obj.height);
        obj.zIndex = imgObjArr.length;

        if(typeof callback === 'function')callback.call(obj, obj);
        // checkUndoable();
      });
    };

    obj.updateData = function(){
      this.data = ctx.getImageData(this.left, this.top, this.width+2, this.height+2);
    };

    obj.drawFromData = function(left, top){
      if(!this.image) return;

      this.left = left || this.left;
      this.top = top || this.top;

      this.updateData();
      ctx.drawImage(this.image, this.left, this.top, this.width, this.height);

    };

    obj.move = function(left, top){
      this.drawFromData(left, top);
      this.focus(false);
    };

    obj.focused = false;

    obj.focus = function(changeState){
      var oL = this.left, oT = this.top, oR = this.left + this.width, oB = this.top + this.height;

      if(this.focused) return;

      if(changeState) this.focused = true;

      this.updateLineDatas();

      ctx.save();
      ctx.strokeStyle = 'rgb(0, 255, 0)';
      ctx.beginPath();
      ctx.moveTo(oL, 0);
      ctx.lineTo(oL, boardHeight);
      ctx.moveTo(oR, 0);
      ctx.lineTo(oR, boardHeight);
      ctx.moveTo(0, oT);
      ctx.lineTo(boardWidth, oT);
      ctx.moveTo(0, oB);
      ctx.lineTo(boardWidth, oB);
      ctx.stroke();
      ctx.restore();

    };

    obj.blur = function(){
      if(!this.focused || this.linesData === undefined) return;

      this.focused = false;

      var data = this.linesData;
      ctx.putImageData(data.oL.data, data.oL.left, data.oL.top);
      ctx.putImageData(data.oT.data, data.oT.left, data.oT.top);
      ctx.putImageData(data.oR.data, data.oR.left, data.oR.top);
      ctx.putImageData(data.oB.data, data.oB.left, data.oB.top);

      delete this.linesData;
    };

    obj.updateLineDatas = function(){
      var oL = this.left, oT = this.top, oR = this.left + this.width, oB = this.top + this.height;

      this.linesData = {
        oL: {
          left: oL-1,
          top: 0,
          data: ctx.getImageData(oL-1, 0, 2, boardHeight)
        },
        oT: {
          left: 0,
          top: oT-1,
          data: ctx.getImageData(0, oT-1, boardWidth, 2)
        },
        oR: {
          left: oR-1,
          top: 0,
          data: ctx.getImageData(oR-1, 0, 2, boardHeight)
        },
        oB: {
          left: 0,
          top: oB-1,
          data: ctx.getImageData(0, oB-1, boardWidth, 2)
        }
      };
    };

    obj.remove = function(isRmoveData){
      ctx.putImageData(this.data, this.left, this.top);
      if(isRmoveData){
        console.log(imgObjArr.indexOf(this));
        imgObjArr.splice(imgObjArr.indexOf(this), 1);
      }
    }

    return obj;
  }

  function preventHandler(e){
    e.preventDefault();
    e.stopPropagation();
  }

  function onFileInputChange(e){
    multiFileUpload(fileInput.files);
  }

  function onCanvasDrop(e){
    e.preventDefault();

    multiFileUpload(e.dataTransfer.files);
  }

  function multiFileUpload(files){
    var fileList = files;
    if(fileList.length === 0) return false;

    if(startPoint){
      endPoint();
    }

    if(pointsResult.length > 0){
      // reset(false);
      removeAllPoints(false);
    }

    var left = boardWidth/2;
    var top = boardHeight/2;
    var exitLastObj = imgObjArr[imgObjArr.length-1];

    slice.call(fileList).forEach(function(file, i){
      if(!file.type.match(/^image/)){
        alert('您上传的不是图片文件');
        return;
      }

      var obj = createImgObj(file);

      if(exitLastObj) exitLastObj.blur();

      obj.drawFromFile(left+i*20, top+i*20, function(imgObj){
        imgObjArr.push(imgObj);
        if(i === fileList.length-1) drawAllPoints();
      });

    });
  }

  var moveBgData = null;

  function onCanvasImgMouseDown(e){
    var left = e.pageX - boardLeft;
    var top = e.pageY - boardTop;
    var lastIndex = imgObjArr.length-1;
    var selectObj = getClickedObj(left, top);
    var lastImgObj = imgObjArr[lastIndex];

    if(startPoint) return;

    if(selectObj === null){
      if(lastImgObj && lastImgObj.focused) lastImgObj.blur();
      return;
    };

    var distX = left - selectObj.left + boardLeft;
    var distY = top - selectObj.top + boardTop;

    var objIndex = imgObjArr.indexOf(selectObj);
    if(objIndex !== lastIndex){
      lastImgObj.blur();
      reSortImgs(selectObj);
    }

    if(selectObj.focused){
      document.addEventListener('mousemove', onCanvasImgMouseMove, false);
      selectObj.focused = false;
    }else{
      selectObj.remove();
      drawAllPoints();
      moveBgData = canvasToImg(canvas);
      removeAllPoints();

      selectObj.drawFromData();
      selectObj.focus(true);
    }
    document.addEventListener('mouseup', onCanvasImgMouseUp, false);

    function onCanvasImgMouseMove(ev){
      var newLeft = ev.pageX - distX;
      var newTop = ev.pageY - distY;

      ev.preventDefault();
      ctx.clearRect(0, 0, boardWidth, boardHeight);
      ctx.drawImage(moveBgData, 0, 0, moveBgData.width, moveBgData.height);
      selectObj.move(newLeft, newTop);
    }

    function onCanvasImgMouseUp(ev){
      document.removeEventListener('mousemove', onCanvasImgMouseMove, false);

      if(!selectObj.focused){
        reset(false);
        drawAllImgs(false);
        selectObj.updateLineDatas();
        selectObj.remove();
        moveBgData = canvasToImg(canvas);
        selectObj.drawFromData();
        selectObj.focus(true);
      }

      drawAllPoints();

      document.removeEventListener('mouseup', onCanvasImgMouseUp, false);
    }
  }

  function reSortImgs(topImgObj){
    var index = imgObjArr.indexOf(topImgObj);

    reset(false);

    imgObjArr.splice(index, 1);
    imgObjArr.push(topImgObj);

    imgObjArr.forEach(function(o, i){
      o.data = ctx.getImageData(o.left, o.top, o.width+2, o.height+2);
      ctx.drawImage(o.image, o.left, o.top, o.width, o.height);
      o.zIndex = i;
    });
  }

  function getClickedObj(left, top){
    var i = imgObjArr.length;
    var resArr = [];
    var zIndexArr = [];
    var temp, oL, oT, oB, oR;
    while(i--){
      temp = imgObjArr[i];
      oL = temp.left;
      oT = temp.top;
      oR = oL + temp.width;
      oB = oT + temp.height;

      if(left > oL && top > oT && left < oR && top < oB){
        resArr.push(temp);
        zIndexArr.push(temp.zIndex);
      };
    }

    if(resArr.length === 0){
      return null;
    }else if(resArr.length === 1){
      return resArr[0];
    }else{
      return resArr[zIndexArr.indexOf(Math.max.apply(null, zIndexArr))];
    }
  }

  function onCanvasPointMove(e){
    var ex = e.pageX;
    var ey = e.pageY;

    var left = ex - boardLeft;
    var top = ey - boardTop;

    if(imageDataX || imageDataY){
      ctx.putImageData(imageDataX, prevLeft-1, 0);
      ctx.putImageData(imageDataY, 0, prevTop-1);
    }

    imageDataX = ctx.getImageData(left-1, 0, 2, boardHeight);
    imageDataY = ctx.getImageData(0, top-1, boardWidth, 2);
    prevLeft = left;
    prevTop = top;

    ctx.setLineDash([2]);
    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(left, boardHeight);
    ctx.moveTo(0, top);
    ctx.lineTo(boardWidth, top);
    ctx.stroke();
  }

  function onCanvasPointLeave(e){
    fixLines();
  }

  // 修复打点时的辅助线
  function fixLines(){
    if(imageDataX || imageDataY){
      ctx.putImageData(imageDataX, prevLeft-1, 0);
      ctx.putImageData(imageDataY, 0, prevTop-1);
    }
    
    imageDataX = imageDataY = null;
    prevLeft = prevTop = 0;
  }

  function onCanvasPointClick(e){
    var left = e.pageX - boardLeft;
    var top = e.pageY - boardTop;
    var radius = 3;
    var color = 'rgb(255, 0, 0)';

    if(imageDataX || imageDataY){
      ctx.putImageData(imageDataX, prevLeft-1, 0);
      ctx.putImageData(imageDataY, 0, prevTop-1);
    }

    pointsDataArr.push({
      radius: radius,
      color: color,
      left: left-radius,
      top: top-radius,
      data: ctx.getImageData(left-radius, top-radius, radius*2, radius*2)
    });

    pointsResult.push({
      left: left,
      top: top
    });

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(left, top, radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();

    imageDataX = ctx.getImageData(left-1, 0, 2, boardHeight);
    imageDataY = ctx.getImageData(0, top-1, boardWidth, 2);
    prevLeft = left;
    prevTop = top;

    results.value = JSON.stringify(pointsResult, null, 4);
    checkUndoable();
  }

  // 撤销最新的点
  function undoPoint(){
    if(pointsDataArr.length === 0 && pointsResult.length === 0) return;

    var imageData = pointsDataArr.splice(pointsDataArr.length-1, 1)[0];

    ctx.putImageData(imageData.data, imageData.left, imageData.top);

    if(pointsResult.length > 0){
      pointsResult.pop();
      if(pointsResult.length === 0){
        results.value = "";
      }else{
        results.value = JSON.stringify(pointsResult, null, 4);
      }
    }
    
    checkUndoable();
  }

  // 检查是否可撤销
  function checkUndoable(){
    if(pointsResult.length > 0 || pointsDataArr.length > 0){
      undoBtn.classList.remove('btn-disabled');
      undoBtn.classList.add('btn-green');
      undoBtn.addEventListener('click', undoPoint, false);
    }else{
      undoBtn.classList.remove('btn-green');
      undoBtn.classList.add('btn-disabled');
      undoBtn.removeEventListener('click', undoPoint, false);
    }
  }

  // 清除所有内容
  function reset(isRemoveDatas){

    if(isRemoveDatas){
      results.value = '';
      pointsDataArr = [];
      pointsResult = [];
      imgObjArr = [];
    }
    
    checkUndoable();

    setOpacityBackground();
    setBackground(bgImg);
  }

  // 清除所有点和点的数据
  function removeAllPoints(isRemoveDatas){
    var i = pointsDataArr.length;
    var obj;

    if(i === 0) {
      results.value = ''; // 清除缓存
      return;
    }

    while(i--){
      obj = pointsDataArr[i];
      ctx.putImageData(obj.data, obj.left, obj.top);
    }

    if(isRemoveDatas){
      pointsDataArr = [];
      results.value = '';
      pointsResult = [];
    }

    checkUndoable();
  }

  function drawAllPoints(){
    if(pointsDataArr.length === 0) return;

    ctx.save();
    pointsDataArr.forEach(function(obj, i){
      obj.data = ctx.getImageData(obj.left, obj.top, obj.radius*2, obj.radius*2);
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(obj.left+obj.radius, obj.top+obj.radius, obj.radius, 0, 2*Math.PI);
      ctx.fill();
    });
    ctx.restore();
  }

  function updatePointDatas(){
    if(pointsDataArr.length === 0) return;

    var i = pointsDataArr.length;
    var obj;

    while(i--){
      obj = pointsDataArr[i];
      obj.data = ctx.getImageData(obj.left, obj.top, obj.radius*2, obj.radius*2);
    }
  }

  // 删除所有图片和图片数据
  function removeAllImgs(isRemoveDatas){
    reset(false);

    drawAllPoints();

    if(isRemoveDatas){
      imgObjArr = [];
    }

  }

  function drawAllImgs(isUpdateDatas){

    if(imgObjArr.length === 0) return;

    var lastImgObj = imgObjArr[imgObjArr.length-1];
    var isFocused = lastImgObj.focused;

    if(isUpdateDatas) lastImgObj.updateLineDatas();
    if(isFocused) lastImgObj.blur();

    imgObjArr.forEach(function(obj, i){
      if(isUpdateDatas) {
        obj.updateData();
      }

      obj.drawFromData();
    });

    if(isFocused) lastImgObj.focus(true);

  }

  // function updateImgDatas(){
  //   if(imgObjArr.length === 0) return;

  //   var i = imgObjArr.length;

  //   while(i--){
  //     imgObjArr[i].updateData();
  //   }

  // }

  function getStyle(element, cssProp){
    var cssObj = getComputedStyle(element);
    var propVal = cssObj[cssProp];
    var numProps = /width|height|left|top/;

    if(!!cssProp.match(numProps)){
      propVal = Number(propVal.replace(/\D*$/, ''));
      return isNaN(propVal) ? 0 : propVal;
    }

    return propVal;
  }

  function canvasToImg(canvas){
    var img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  function clone(object, deepClone){
    if(typeof object === 'object'){
      if(object instanceof Node){
        return object.cloneNode(deepClone);
      }else{
        return cloneObj(object, deepClone);
      }
    }else{
      return object;
    }

    function cloneObj(obj, deep){
      var res;
      if(obj instanceof Array){
        res = [];
      }else if(obj instanceof Node){
        return obj.cloneNode(deep);
      }else{
        res = {};
      }

      for(var key in obj){
        if(!obj.hasOwnProperty(key)) continue;

        if(deep){
          if(typeof obj[key] === 'object'){
            res[key] = cloneObj(obj[key], true);
          }else{
            res[key] = obj[key];
          }
        }else{
          res[key] = obj[key];
        }
        
      }

      return res;
    }
  }

})(window)