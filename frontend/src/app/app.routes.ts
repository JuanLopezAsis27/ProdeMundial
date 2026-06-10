import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { redirectIfAuthGuard } from './core/auth/redirect-if-auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [redirectIfAuthGuard],
    loadComponent: () => import('./features/welcome/welcome').then(m => m.Welcome)
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },
  {
    path: 'mundial',
    canActivate: [authGuard],
    loadComponent: () => import('./features/world-cup/world-cup-hub/world-cup-hub').then(m => m.WorldCupHub)
  },
  {
    path: 'grupos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-list/group-list').then(m => m.GroupList)
  },
  {
    path: 'grupos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-detail/group-detail').then(m => m.GroupDetail)
  },
  {
    path: 'auth/login',
    canActivate: [redirectIfAuthGuard],
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'auth/registro',
    canActivate: [redirectIfAuthGuard],
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-panel').then(m => m.AdminPanel)
  },
  { path: '**', redirectTo: '' }
];
