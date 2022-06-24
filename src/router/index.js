import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  // mode: 'history',
  publicPath: process.env.NODE_ENV === 'development' ? '/' : '',
  routes: [
    //    {
    //      path: '/usecase1',
    //      name: 'ViolinPlot',
    //      component: () => import('@/components/ViolinPlot.vue')
    //    },
    //    {
    //      path: '/multi',
    //      name: 'MultiSource',
    //      component: () => import('@/components/MultiSource.vue')
    //    },
    {
      path: '/anatomy',
      name: 'Anatomy',
      component: () => import('@/components/Anatomy.vue'),
      props: route => ({
        uberonIds: route.query.uberon_ids,
        width: +route.query.width,
        height: +route.query.height,
        numTopGenes: +route.query.numTopGenes ? +route.query.numTopGenes : 10
      })
    },
    {
      path: '/anatomy_multi',
      name: 'AnatomyMultiSource',
      component: () => import('@/components/AnatomyMultiSource.vue'),
      props: route => ({
        uberonIds: route.query.uberon_ids,
        width: +route.query.width,
        height: +route.query.height,
        numTopGenes: +route.query.numTopGenes ? +route.query.numTopGenes : 10
      })
    },
    {
      path: '/gene_top_tissues',
      name: 'GeneTopTissues',
      component: () => import('@/components/GeneTissues.vue'),
      props: route => ({
        gencodeId: route.query.gencode_id,
        width: +route.query.width,
        height: +route.query.height,
        numTopTissues: route.query.numTopTissues ? +route.query.numTopTissues : 10,
        hideTitle: +route.query.hideTitle,
        hideControls: +route.query.hideControls
      })
    },
    {
      path: '/gene_tissues',
      name: 'GeneTissues',
      component: () => import('@/components/GeneTissues.vue'),
      props: route => ({
        gencodeId: route.query.gencode_id,
        width: +route.query.width,
        height: +route.query.height,
        numTopTissues: route.query.numTopTissues ? +route.query.numTopTissues : 10,
        hideTitle: +route.query.hideTitle,
        hideControls: +route.query.hideControls,
        uberonIds: route.query.uberonIds,
        tissueSiteDetailIds: route.query.tissueSiteDetailIds
      })
    },
    {
      path: '/gene_transcripts',
      name: 'GeneTranscripts',
      component: () => import('@/components/GeneTranscripts.vue'),
      props: route => ({
        gencodeId: route.query.gencode_id,
        width: +route.query.width,
        height: +route.query.height,
        hideTitle: +route.query.hideTitle,
        hideControls: +route.query.hideControls
      })
    }
  ]
})
