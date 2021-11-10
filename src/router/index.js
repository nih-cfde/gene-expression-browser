import Vue from 'vue'
import Router from 'vue-router'
import ViolinPlot from '@/components/ViolinPlot'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ViolinPlot',
      component: ViolinPlot
    }
  ]
})
