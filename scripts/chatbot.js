const RESPONSES = [
  {
    match: /break|rest/i,
    reply: "Remember to log it after your tree grows. Until then, breathe and stay on track."
  },
  {
    match: /motivat|struggl/i,
    reply: 'Small wins count. Try committing to the next five minutes—momentum will follow.'
  },
  {
    match: /plan|next/i,
    reply: 'Jot the idea in your notebook so it is safe, then return to the task at hand.'
  },
  {
    match: /thanks|thank you/i,
    reply: 'Happy to help. I will be here if you need a focused nudge again.'
  },
];

export function createChatReply(message) {
  const trimmed = message.trim();
  if (!trimmed) {
    return 'Could you share a specific question? I will keep it brief.';
  }
  for (const option of RESPONSES) {
    if (option.match.test(trimmed)) {
      return option.reply;
    }
  }
  if (/time|timer/i.test(trimmed)) {
    return 'Your timer keeps running here. Check the center column to see the remaining minutes.';
  }
  if (/music|spotify/i.test(trimmed)) {
    return 'Control playback with the Spotify tile on the left—no need to open new tabs.';
  }
  if (/weather/i.test(trimmed)) {
    return 'Update the ZIP code in the weather widget to see the latest conditions without leaving Blyx.';
  }
  return 'Let us keep it crisp: what is the next action you can take toward finishing this focus block?';
}
