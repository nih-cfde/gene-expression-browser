import Vue from 'vue'
import Router from 'vue-router'
import ViolinPlot from '@/components/ViolinPlot'
import MultiSource from '@/components/MultiSource'

Vue.use(Router)

export default new Router({
    mode: 'history',
    routes: [
    {
      path: '/',
      redirect: '/multi'
    },
    {
      path: '/usecase1',
      name: 'ViolinPlot',
      component: () => import('@/components/ViolinPlot.vue'),
    },
    {
      path: '/multi',
      name: 'MultiSource',
      component: () => import('@/components/MultiSource.vue'),
    },
    {
      path: '/biosample',
      name: 'Biosample',
      component: () => import('@/components/Biosample.vue'),
      props: route => ({
          uberonId: route.query.uberon_id,
	  width: +route.query.width,
	  height: +route.query.height,
	  numTopGenes: +route.query.numTopGenes,
      }),

    },

    ]
})
