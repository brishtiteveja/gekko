<template lang='pug'>
#indicatorChartWrapper(v-bind:class='{ clickable: !isClicked }')
  .shield(v-on:click.prevent='click')
  svg#indicatorChart(width='960', :height='height')
</template>

<script>

import indicatorChart from '../../../d3/indicatorChart1'
import { draw as drawMessage, clear as clearMessage } from '../../../d3/indicatorChartMessage'

const MIN_CANDLES = 4;

export default {
  props: ['data', 'height'],

  data: function() {
    return {
      isClicked: false
    }
  },

  watch: {
    data: function() { this.render() },
  },

  created: function() { setTimeout( this.render, 100) },
  beforeDestroy: function() {
    this.remove();
  },

  methods: {
    click: function() {
      this.isClicked = true;
    },
    render: function() {
      this.remove();


      if(_.size(this.data.candles) < MIN_CANDLES) {
        drawMessage('Not enough data to spawn indicatorChart');
      } else {
        indicatorChart(this.data.candles, this.data.trades, this.height);
      }
    },
    remove: function() {
      d3.select('#indicatorChart').html('');
    }
  }
}
</script>

<style>

#indicatorChartWrapper.clickable {
  position: relative;
}

#indicatorChartWrapper.clickable .shield {
  cursor: zoom-in;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: grey;
  opacity: 0.1;
}

#indicatorChart {
  background-color: #eee;
  width: 100%;
}

#indicatorChart circle {
  clip-path: url(#clip);
}

#indicatorChart .zoom {
  cursor: move;
  fill: none;
  pointer-events: all;
}

#indicatorChart .line {
  fill: none;
  stroke: steelblue;
  stroke-width: 1.5px;
  clip-path: url(#clip);
}

/*#indicatorChart .price.line {
  stroke-width: 2.5px;
}*/

#indicatorChart circle.buy {
  fill: #7FFF00;
}

#indicatorChart circle.sell {
  fill: red;
}

</style>
