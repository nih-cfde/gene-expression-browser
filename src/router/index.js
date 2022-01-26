import Vue from 'vue'
import Router from 'vue-router'
import ViolinPlot from '@/components/ViolinPlot'
import MultiSource from '@/components/MultiSource'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/usecase1'
    },
    {
      path: '/usecase1/',
      name: 'ViolinPlot',
      component: ViolinPlot
    },
    {
      path: '/multi',
      name: 'MultiSource',
      component: MultiSource
    }
  ]
})
