import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar';
import { Footer} from '../../shared/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  features = [
    {
      title: 'Community & Trust',
      desc: 'Join a network of neighbors dedicated to looking out for one another and their belongings.',
    },
    {
      title: 'Smart Categorization',
      desc: 'Filter by location, date, or item type to find exactly what you\'re looking for in seconds.',
    },
    {
      title: 'Safe Returns',
      desc: 'Coordinate meetups in public spaces through our integrated community map.',
    },
  ];

  communityCards = [
    { title: 'Lost & Found',    desc: 'Browse items found in your area.',        icon: '🔍' },
    { title: 'Verified Proof',  desc: 'Confirm ownership through photos.',        icon: '🔒' },
    { title: 'Safe Meetups',    desc: 'Connect with neighbors safely.',           icon: '🤝' },
  ];

  testimonials = [
    { quote: 'LoFu the best!',                                                       name: 'Jillian Benbow',  role: 'Senior Community Manager' },
    { quote: 'Can\'t recommend LoFu enough 👍',                                       name: 'Montes Kei',      role: 'Developer at CBN' },
    { quote: 'I love LoFu! I browse it daily too.',                                  name: 'Enters JK',       role: 'Software Eng. at Bom' },
    { quote: 'Hey LoFu you all did an amazing job. It\'s seriously saving me so much time.', name: 'Pilliaf Tom', role: 'Senior Manager' },
    { quote: 'LoFu one of *the* nicest, most wonderful, amazing website.',           name: 'Jillian',         role: 'Community Manager' },
    { quote: 'Have you used LoFu before? It\'s so nice. I found my lost tablet because of it. Very helpful!', name: 'Benbow', role: 'Senior Manager' },
    { quote: 'LoFu is my favourite',                                                 name: 'Jillian Benbow',  role: 'Senior Community Manager' },
    { quote: 'LoFu does anything and everything I need. 😊',                         name: 'Jillian Benbow',  role: 'Senior Community Manager' },
    { quote: 'LoFu helps neighbors track lost items and manage returns efficiently.', name: 'Community Member', role: 'Angeles City' },
  ];
}