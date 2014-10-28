/*
*Donut Directive
*/
app.directive('donutChart', function() {
  function link (scope, el) {
    var data = scope.data;
    var color = d3.scale.category10()
    var el = el[0]
    var width = el.clientWidth;
    var height = el.clientHeight;
    //scope.shared.width = width;
    //scope.shared.height = height;
    var min = Math.min(width, height);
    var pie = d3.layout.pie().sort(null)
    var arc = d3.svg.arc()
      .outerRadius(min / 2 * 0.9)
      .innerRadius(min / 2 * 0.5)
    var svg = d3.select(el).append('svg')
     var g = svg.append('g')
    // add the <path>s for each arc slice
    var arcs = g.selectAll('path')
    /*On resize redraw all that is affected by width & height*/
    scope.$watch(function() {
      return el.clientWidth * el.clientHeight
    },function() {
      width = el.clientWidth
      height = el.clientHeight
      min = Math.min(width, height)
      arc.outerRadius(min / 2 * 0.9).innerRadius(min / 2 * 0.5)
      svg.attr({width: width, height: height})
      g.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
      arcs.attr('d', arc)
    });
    /*Called by attrTween to animate arc*/
    function arcTween(a) {
      // see: http://bl.ocks.org/mbostock/1346410
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function(t) {
        return arc(i(t));
      };
    }
    /*On data enter, tween for new data| On data exit, tween for removing old data| On data, tween for unchanged data*/
    scope.$watch('data', function(data){
      var duration = 1000
      arcs = arcs.data(pie(data))
      arcs.transition()
        .duration(duration)
        .attrTween('d', arcTween)
      
      arcs.enter()
        .append('path')
        .style('stroke', 'white')
        .style('fill', function(d){ if(d < 6) {return "red"}else { return "green"}})
        //.attr('fill', function(d){ if(d < 6) {return "red";}else { return "green";}})
        .each(function(d) {
          this._current = { startAngle: 2 * Math.PI - 0.001, endAngle: 2 * Math.PI }
        })
        .transition()
        .duration(duration)
        .attrTween('d', arcTween)
      
      arcs.exit()
        .transition()
        .duration(duration)
        .each(function(d){ 
          d.startAngle = 2 * Math.PI - 0.001; d.endAngle = 2 * Math.PI; 
        })
        .attrTween('d', arcTween).remove();
    })
    /*on click on svg window.location to next view| input random data again*/
    g.on('mouseover', function(d, i){
      //scope.hovered({args:d});
    });
    g.on('mousedown', function(){
     alert('Go somewhere');
    })
  }
  return {
    link:link,
    restrict:'E',
    scope:{
      data:'=',
      hovered: '&hovered'
    }
  }
});