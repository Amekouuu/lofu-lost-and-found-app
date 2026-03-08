import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home),
  },
  {
    path: 'lost-items',
    loadComponent: () => import('./pages/lost-items/lost-items').then(m => m.LostItems),
  },
  {
    path: 'post/:id',
    loadComponent: () => import('./pages/post-detail/post-detail').then(m => m.PostDetail),
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/create-post/create-post').then(m => m.CreatePost),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.Register),
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./pages/profile/profile').then(m => m.Profile),
  },
  {
    path: 'claim/:id',
    loadComponent: () => import('./pages/claim-chat/claim-chat').then(m => m.ClaimChat),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then(m => m.About),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then(m => m.Contact),
  },
  {
    path: '**',
    redirectTo: '',
  }
];