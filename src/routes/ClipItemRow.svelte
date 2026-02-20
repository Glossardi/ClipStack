<script lang="ts">
  import { fade } from 'svelte/transition';

  export let item: {
    id: string;
    content: string;
    content_type: string;
    created_at: number;
  };
  export let onCopy: () => void = () => {};
  export let onDelete: () => void = () => {};

  let isHovering = false;
  let showCheckmark = false;

  function getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  function getTypeLabel(type: string): string {
    return type === 'url' ? 'URL' : 'Text';
  }

  function handleCopy() {
    showCheckmark = true;
    onCopy();
    setTimeout(() => { showCheckmark = false; }, 600);
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    onDelete();
  }
</script>

<div
  class="clip-item"
  class:hovering={isHovering}
  on:mouseenter={() => isHovering = true}
  on:mouseleave={() => isHovering = false}
  role="listitem"
>
  <button
    class="clip-copy"
    on:click={handleCopy}
    aria-label="Copy: {item.content.substring(0, 60)}"
  >
    <div class="type-badge" class:url={item.content_type === 'url'}>
      {item.content_type === 'url' ? 'URL' : 'A'}
    </div>

    <div class="content">
      <div class="text">{item.content}</div>
      <div class="meta">
        <span>{getRelativeTime(item.created_at)}</span>
        <span class="dot">·</span>
        <span>{getTypeLabel(item.content_type)}</span>
      </div>
    </div>
  </button>

  <div class="actions">
    {#if showCheckmark}
      <span class="checkmark" transition:fade={{ duration: 120 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8L6.5 11.5L13 5" stroke="#34c759" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    {:else if isHovering}
      <button
        class="delete-btn"
        on:click={handleDelete}
        aria-label="Delete this clipboard item"
        transition:fade={{ duration: 80 }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .clip-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transition: background-color 0.1s ease;
  }

  :global(html.dark) .clip-item {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .clip-item:last-child {
    border-bottom: none;
  }

  .clip-item:hover,
  .clip-item.hovering {
    background: rgba(0, 0, 0, 0.04);
  }

  :global(html.dark) .clip-item:hover,
  :global(html.dark) .clip-item.hovering {
    background: rgba(255, 255, 255, 0.05);
  }

  .clip-copy {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    cursor: pointer;
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    text-align: left;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .type-badge {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.07);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.45);
    letter-spacing: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  }

  .type-badge.url {
    background: rgba(0, 122, 255, 0.1);
    color: #007aff;
  }

  :global(html.dark) .type-badge {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.45);
  }

  :global(html.dark) .type-badge.url {
    background: rgba(10, 132, 255, 0.15);
    color: #0a84ff;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .text {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.82);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-all;
  }

  :global(html.dark) .text {
    color: rgba(255, 255, 255, 0.82);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: rgba(0, 0, 0, 0.35);
    margin-top: 2px;
    letter-spacing: 0;
  }

  :global(html.dark) .meta {
    color: rgba(255, 255, 255, 0.3);
  }

  .dot {
    opacity: 0.6;
  }

  .actions {
    flex-shrink: 0;
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .checkmark {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.12s, background-color 0.12s;
    width: 24px;
    height: 24px;
  }

  .delete-btn:hover {
    color: #ff3b30;
    background: rgba(255, 59, 48, 0.08);
  }

  :global(html.dark) .delete-btn {
    color: rgba(255, 255, 255, 0.25);
  }

  :global(html.dark) .delete-btn:hover {
    color: #ff453a;
    background: rgba(255, 69, 58, 0.12);
  }
</style>
