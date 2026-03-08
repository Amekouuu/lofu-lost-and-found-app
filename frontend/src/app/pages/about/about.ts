import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar';
import { Footer } from '../../shared/footer';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  steps = [
    {
      number: '1',
      title: 'Snap and Share',
      desc: 'Whether you\'ve lost an item or found something that doesn\'t belong to you, posting takes less than a minute. Just upload a photo, add a location tag, and write a brief description.',
    },
    {
      number: '2',
      title: 'Explore the feed.',
      desc: 'Users can scroll through the latest "Lost" and "Found" posts in their area to see if a matching item has been reported. Our simple layout makes it easy to spot what you\'re looking for.',
    },
    {
      number: '3',
      title: 'Send a message.',
      desc: 'If you recognize an item, just click the "I found it!" button. This starts a private conversation where you can coordinate a safe handover and get the item back home.',
    },
  ];

  quotes = [
    {
      text: 'Building this platform wasn\'t just about the code; it was about creating a safer neighborhood. I wanted to make sure that when someone loses something important, they have a reliable place to turn to.',
      author: '– Shannen G. Pascual, UI/UX Designer',
    },
    {
      text: 'We focus on simplicity and security. By enabling direct, private communication between neighbors, we\'re helping people bypass the noise of social media and get straight to the mission.',
      author: '– Julien-Michael Purnalan, Full Stack Developer',
    },
    {
      text: 'Every time I see a post marked "Reunited," it reminds me why we started LoFu. It\'s about more than just items — it\'s about the small acts of kindness that make our community stronger.',
      author: '– Micko Alberto, Front-end',
    },
  ];
}