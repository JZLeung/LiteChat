<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import {
		ATTACHMENT_FILE_ITEMS,
		ATTACHMENT_EXTRA_ITEMS,
		TOOLTIP_DELAY_DURATION
	} from '$lib/constants';
	import { AttachmentMenuItemId } from '$lib/enums';

	import { useAttachmentMenu } from '$lib/hooks/use-attachment-menu.svelte';

	interface Props {
		class?: string;
		disabled?: boolean;
		hasAudioModality?: boolean;
		hasVisionModality?: boolean;
		hasMcpPromptsSupport?: boolean;
		hasMcpResourcesSupport?: boolean;
		onFileUpload?: () => void;
		onSystemPromptClick?: () => void;
		onMcpPromptClick?: () => void;
		onMcpSettingsClick?: () => void;
		onMcpResourcesClick?: () => void;
		trigger: Snippet<[{ disabled: boolean }]>;
	}

	let {
		class: className = '',
		disabled = false,
		hasAudioModality = false,
		hasVisionModality = false,
		hasMcpPromptsSupport = false,
		hasMcpResourcesSupport = false,
		onFileUpload,
		onSystemPromptClick,
		onMcpPromptClick,
		onMcpSettingsClick,
		onMcpResourcesClick,
		trigger
	}: Props = $props();

	let dropdownOpen = $state(false);

	const attachmentMenu = useAttachmentMenu(
		() => ({ hasVisionModality, hasAudioModality, hasMcpPromptsSupport, hasMcpResourcesSupport }),
		() => ({ onFileUpload, onSystemPromptClick, onMcpPromptClick, onMcpResourcesClick }),
		() => {
			dropdownOpen = false;
		}
	);
</script>

<div class="flex items-center gap-1 {className}">
	<DropdownMenu.Root bind:open={dropdownOpen}>
		<DropdownMenu.Trigger name="Attach files" {disabled}>
			{@render trigger({ disabled })}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content align="start" class="w-48">
			{#each ATTACHMENT_FILE_ITEMS as item (item.id)}
				{@const enabled = attachmentMenu.isItemEnabled(item.enabledWhen)}
				{#if enabled}
					<DropdownMenu.Item
						class="{item.class ?? ''} flex cursor-pointer items-center gap-2"
						onclick={() => attachmentMenu.callbacks[item.action]()}
					>
						<item.icon class="h-4 w-4" />

						<span>{item.label}</span>
					</DropdownMenu.Item>
				{:else if item.disabledTooltip}
					<Tooltip.Root delayDuration={TOOLTIP_DELAY_DURATION}>
						<Tooltip.Trigger class="w-full">
							<DropdownMenu.Item
								class="{item.class ?? ''} flex cursor-pointer items-center gap-2"
								disabled
							>
								<item.icon class="h-4 w-4" />

								<span>{item.label}</span>
							</DropdownMenu.Item>
						</Tooltip.Trigger>

						<Tooltip.Content side="right">
							<p>{item.disabledTooltip}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			{/each}

			<DropdownMenu.Separator />

			{#each ATTACHMENT_EXTRA_ITEMS as item (item.id)}
				{#if item.id === AttachmentMenuItemId.SYSTEM_MESSAGE}
					<Tooltip.Root delayDuration={TOOLTIP_DELAY_DURATION}>
						<Tooltip.Trigger class="w-full">
							<DropdownMenu.Item
								class="flex cursor-pointer items-center gap-2"
								onclick={() => attachmentMenu.callbacks[item.action]()}
							>
								<item.icon class="h-4 w-4" />

								<span>{item.label}</span>
							</DropdownMenu.Item>
						</Tooltip.Trigger>

						<Tooltip.Content side="right">
							<p>{attachmentMenu.getSystemMessageTooltip()}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			{/each}

			<!-- MCP items hidden -->
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>