/*
*Bar Chart directive
*/
app.directive('barChart', function(){
  var chart = d3.custom.barChart();
  return {
    restrict: 'E',
    replace: true,
    template: '<div class="chart"></div>',
    scope:{
      height: '=height',
       height: '=height',
      data: '=data',
      hovered: '&hovered'
    },
  link: function(scope, element, attrs) {
      var el = d3.select(element[0]);
      chart.on('customHover', function(d, i){
        scope.hovered({args:i});
      });

      scope.$watch('data', function (newVal, oldVal) {
        el.datum(newVal).call(chart);
      });

    scope.$watch(function(){
      return element[0].clientWidth * element[0].clientHeight;
    },function(){
      el.call(chart.height(document.body.clientHeight*0.4));
      el.call(chart.width((document.body.clientWidth -10)*0.4));
    });
    }
  }
})
