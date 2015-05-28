function Switcher(func, params,cStyle){
  if (window.self == window.top) {
    var eventFunction = func;
    var eventParams = params;
    var width = 0;

    var switcherEL = document.createElement('div');
    switcherEL.className = "control";
    var styleUL = document.createElement('ul');

    var titleLI = document.createElement('li');
    var titleTxt = document.createTextNode('styles');
    titleLI.appendChild(titleTxt);
    titleLI.className = 'title';
    styleUL.appendChild(titleLI);
    
    titleLI.addEventListener('click',function(e){
      titleLI.classList.toggle('active');
      var style = document.querySelectorAll('li.style');
      var len = style.length;
      var i =0;
      for( i =0; i<len; i++){
        style[i].classList.toggle('show');
      }
    });

    params.forEach(function(styleName,index){
      var styleLI = document.createElement('li');
      var styleTxt = document.createTextNode(styleName);
      styleLI.appendChild(styleTxt);
      styleLI.className = 'style';
      if(styleName == cStyle){
        styleLI.classList.add('active');
      }
      styleLI.style.cssText = 'top: ' + ((index+1) * 48) + 'px';
      styleLI.addEventListener('click',function(e){
        func(styleName);
        removeActiveClass();
        styleLI.classList.add('active');
      });
      styleUL.appendChild(styleLI);
    });
    switcherEL.appendChild(styleUL);
    document.body.appendChild(switcherEL);
  }

   function removeActiveClass(){
      var style = document.querySelectorAll('li.style');
      var len = style.length;
      var i =0;
      for( i =0; i<len; i++){
          style[i].classList.remove('active');
      }
   }
}