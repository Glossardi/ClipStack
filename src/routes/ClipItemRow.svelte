<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let item: {
    id: string;
    content: string;
    content_type: string;
    created_at: number;
  };

  const dispatch = createEventDispatcher<{
    copy: void;
    delete: void;
  }>();

  let isHovering = false;
  let showCheckmark = false;

  function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  function getContentTypeLabel(type: string): string {
    return type === 'url' ? 'URL' : type.charAt(0).toUpperCase() + type.slice(1);
  }

  function getIcon(type: string): string {
    switch (type) {
      case 'url': return '🔗';
      case 'image': return '🖼';
      default: return '📄';
    }
  }

  function truncateContent(content: string): string {
    if (content.length <= 100) return content;
    return content.substring(0, 100) + '...';
  }

  function handleCopy() {
    dispatch('copy');
    showCheckmark = true;
    setTimeout(() => {
      showCheckmark = false;
    }, 800);
  }
</script>

<div
  class="clip-item"
  class:hovering={isHovering}
  on:click={handleCopy}
  on:mouseenter={() => isHovering = true}
  on:mouseleave={() => isHovering = false}
>
  <div class="icon">{getIcon(item.content_type)}</div>

  <div class="content">
    <div class="text">{truncateContent(item.content)}</div>
    <div class="meta">
      <span>{getRelativeTime(item.created_at)}</span>
      <span class="separator">•</span>
      <span>{getContentTypeLabel(item.content_type)}</span>
    </div>
  </div>

  {#if showCheckmark}
    <div class="checkmark" transition:fade={{duration: 150}}>✓</div>
  {/if}
</div>

<style>
  .clip-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    position: relative;
  }

  .clip-item:hovering {
    background: rgba(0, 0, 0, 0.05);
  }

  :global(.dark) .clip-item:hovering {
    background: rgba(255, 255, 255, 0.05);
  }

  .icon {
    font-size: 20px;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .text {
    font-size: 14px;
    color: #1a1a1a;
    line-height: 1.4;
    max-height: 2.8em;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }

  :global(.dark) .text {
    color: #e5e5e5;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }

  :global(.dark) .meta {
    color: #999;
  }

  .separator {
    opacity: 0.5;
  }

  .checkmark {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #34c759;
    font-size: 20px;
    font-weight: bold;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-50%) scale(0.8); }
    to { opacity: 1; transform: translateY(-50%) scale(1); }
  }

  .checkmark {
    animation: fadeIn 0.15s ease-out;
  }
</style>
