import { _decorator, Button, Color, Component, EditBox, Label, Node, Prefab, ProgressBar, UITransform, instantiate } from 'cc';
import { AIManager, PurchaseDecision } from '../ai/AIManager';
import { EventBus, GameEvent } from '../core/EventBus';
import { GameManager, GamePhase } from '../core/GameManager';
import { CustomerData } from '../data/CustomerData';
import { AchievementId } from '../data/AchievementData';
import { findProduct } from '../data/ProductData';
import { ArtAssetBinder } from './ArtAssetBinder';
import { ChatBubbleUI, ChatRole } from './ChatBubbleUI';

const { ccclass, property } = _decorator;

@ccclass('ChatUI')
export class ChatUI extends Component {
    @property
    maxDialogueRounds = 4;

    @property
    maxInputLength = 300;

    @property
    resultStaySeconds = 1.2;

    @property
    bubbleViewHeight = 250;

    @property
    bubbleGap = 8;

    @property(AIManager)
    aiManager: AIManager | null = null;

    @property(EditBox)
    input: EditBox | null = null;

    @property(Label)
    customerLabel: Label | null = null;

    @property(Label)
    desireLabel: Label | null = null;

    @property(ProgressBar)
    desireBar: ProgressBar | null = null;

    @property(Node)
    bubbleRoot: Node | null = null;

    @property(Prefab)
    bubblePrefab: Prefab | null = null;

    currentCustomer: CustomerData | null = null;
    currentDesire = 0;
    currentRound = 0;
    isResolvingCustomer = false;
    private bubbleScrollOffset = 0;
    private touchLastY = 0;
    private boundInputNode: Node | null = null;
    private boundBubbleNode: Node | null = null;
    private hintButtonNode: Node | null = null;
    private latestHint = '';
    private latestHintShown = false;

    onEnable(): void {
        EventBus.on<CustomerData>(GameEvent.CustomerArrived, this.handleCustomerArrived);
        this.configureInput();
        this.configureBubbleScroll();
        this.ensureHintButton();
        this.applyArtAssets();
    }

    onDisable(): void {
        EventBus.off<CustomerData>(GameEvent.CustomerArrived, this.handleCustomerArrived);
        this.unbindInputReturn();
        this.unbindBubbleScroll();
        this.hintButtonNode?.off(Button.EventType.CLICK, this.handleHintButton, this);
    }

    async sendMessage(): Promise<void> {
        if (!this.currentCustomer || !this.aiManager || !this.input) {
            return;
        }

        if (this.isResolvingCustomer) {
            return;
        }

        if (GameManager.instance?.phase !== GamePhase.Business) {
            return;
        }

        const playerMessage = this.input.string.trim().slice(0, this.maxInputLength);
        if (!playerMessage) {
            return;
        }

        this.input.string = '';
        this.addBubble(ChatRole.Player, playerMessage);
        this.currentRound += 1;
        EventBus.emit(GameEvent.PlayerMessageSent);

        const products = GameManager.instance?.getSellableProductOffers() ?? [];
        const roundLimit = Math.min(this.maxDialogueRounds, Math.max(1, this.currentCustomer.patience || this.maxDialogueRounds));
        const forceDecision = this.currentRound >= roundLimit;
        const response = await this.aiManager.reply(
            this.currentCustomer,
            playerMessage,
            this.currentDesire,
            products,
            forceDecision,
            this.currentRound,
        );

        this.currentDesire = response.currentDesire;
        this.latestHint = response.reason;
        this.latestHintShown = false;
        this.refreshHintButton();
        this.refreshDesire();
        this.addBubble(ChatRole.Customer, response.message);
        EventBus.emit(GameEvent.CustomerDesireChanged, response.currentDesire);
        if (response.desireDelta >= 20) {
            GameManager.instance?.unlockAchievement(AchievementId.CommunicationMaster);
        }
        if (response.currentDesire >= 100) {
            GameManager.instance?.unlockAchievement(AchievementId.FullDesire);
        }

        if (response.decision === PurchaseDecision.Buy && response.productId) {
            const sold = GameManager.instance?.completeSale(response.productId, 1) ?? false;
            const product = findProduct(response.productId);
            this.addBubble(ChatRole.System, sold ? `结果：购买了${product?.name ?? response.productId}` : '结果：未购买');
            this.finishCurrentCustomer(response.currentDesire);
        }

        if (response.decision === PurchaseDecision.Leave) {
            this.addBubble(ChatRole.System, '结果：未购买');
            this.finishCurrentCustomer(response.currentDesire);
        }
    }

    private handleCustomerArrived = (customer: CustomerData): void => {
        this.currentCustomer = customer;
        const products = GameManager.instance?.getSellableProductOffers() ?? [];
        this.currentDesire = this.aiManager?.calculateInitialDesire(customer, products) ?? customer.initialDesire;
        this.currentRound = 0;
        this.isResolvingCustomer = false;
        this.latestHint = '';
        this.latestHintShown = false;

        if (this.bubbleRoot) {
            this.bubbleRoot.removeAllChildren();
        }
        this.bubbleScrollOffset = 0;

        if (this.customerLabel) {
            this.customerLabel.string = `${customer.name}（${customer.displayName}）`;
        }

        this.refreshDesire();
        this.configureInput();
        this.configureBubbleScroll();
        this.ensureHintButton();
        this.applyArtAssets();
        this.applyCustomerAvatar(customer);
        this.refreshHintButton();
        this.addBubble(ChatRole.Customer, this.aiManager?.createOpening(customer, this.currentDesire) ?? '你好。');
    };

    private finishCurrentCustomer(currentDesire: number): void {
        if (this.isResolvingCustomer) {
            return;
        }

        this.isResolvingCustomer = true;
        this.scheduleOnce(() => {
            EventBus.emit(GameEvent.CustomerLeft, { currentDesire });
        }, this.resultStaySeconds);
    }

    private refreshDesire(): void {
        if (this.desireLabel) {
            this.desireLabel.string = `购买欲望：${this.currentDesire}`;
        }

        if (this.desireBar) {
            this.desireBar.progress = this.currentDesire / 100;
            ArtAssetBinder.applyProgressBar(this.desireBar);
        }
    }

    private handleHintButton = (): void => {
        if (!this.currentCustomer || !this.latestHint || this.latestHintShown) {
            return;
        }

        if (GameManager.instance?.phase !== GamePhase.Business) {
            return;
        }

        this.addBubble(ChatRole.System, `提示：${this.latestHint}`);
        this.latestHintShown = true;
        this.refreshHintButton();
    };

    private configureInput(): void {
        if (this.input && this.maxInputLength > 0) {
            this.input.maxLength = this.maxInputLength;
            this.input.placeholder = '';
            ArtAssetBinder.applyEditBox(this.input);
            this.styleEditBox(this.input);
        }

        if (!this.input || this.boundInputNode === this.input.node) {
            return;
        }

        this.unbindInputReturn();
        this.boundInputNode = this.input.node;
        this.boundInputNode.on(EditBox.EventType.EDITING_RETURN, this.handleInputReturn, this);
    }

    private ensureHintButton(): void {
        const parent = this.input?.node.parent ?? this.node;
        let buttonNode = parent.getChildByName('HintButton');
        if (!buttonNode) {
            buttonNode = new Node('HintButton');
            parent.addChild(buttonNode);
            buttonNode.addComponent(UITransform);
            buttonNode.addComponent(Button);

            const labelNode = new Node('Label');
            buttonNode.addChild(labelNode);
            labelNode.addComponent(UITransform);
            const label = labelNode.addComponent(Label);
            label.string = '提示';
            label.fontSize = 18;
            label.lineHeight = 24;
        }

        const sendButton = parent.getChildByName('SendButton');
        const baseX = sendButton?.position.x ?? (this.input?.node.position.x ?? 0) + 330;
        const baseY = sendButton?.position.y ?? (this.input?.node.position.y ?? 0);
        buttonNode.setPosition(baseX, baseY + 44, 0);
        buttonNode.getComponent(UITransform)?.setContentSize(74, 30);
        buttonNode.getChildByName('Label')?.getComponent(UITransform)?.setContentSize(70, 26);

        this.hintButtonNode = buttonNode;
        ArtAssetBinder.applyButton(buttonNode, 'small');
        buttonNode.off(Button.EventType.CLICK, this.handleHintButton, this);
        buttonNode.on(Button.EventType.CLICK, this.handleHintButton, this);
        this.refreshHintButton();
    }

    private refreshHintButton(): void {
        if (!this.hintButtonNode) {
            return;
        }

        this.hintButtonNode.active = GameManager.instance?.phase === GamePhase.Business
            && !!this.currentCustomer
            && !!this.latestHint
            && !this.latestHintShown;
    }

    private addBubble(role: ChatRole, content: string): void {
        if (!this.bubbleRoot || !this.bubblePrefab) {
            return;
        }

        const bubble = instantiate(this.bubblePrefab);
        this.bubbleRoot.addChild(bubble);
        bubble.getComponent(ChatBubbleUI)?.setup(role, content);
        this.scrollBubblesToBottom();
        this.relayoutBubbles();
    }

    private handleInputReturn = (): void => {
        void this.sendMessage();
    };

    private configureBubbleScroll(): void {
        if (!this.bubbleRoot || this.boundBubbleNode === this.bubbleRoot) {
            return;
        }

        this.unbindBubbleScroll();
        this.boundBubbleNode = this.bubbleRoot;
        this.boundBubbleNode.on(Node.EventType.MOUSE_WHEEL, this.handleBubbleWheel, this);
        this.boundBubbleNode.on(Node.EventType.TOUCH_START, this.handleBubbleTouchStart, this);
        this.boundBubbleNode.on(Node.EventType.TOUCH_MOVE, this.handleBubbleTouchMove, this);
    }

    private handleBubbleWheel = (event: any): void => {
        const scrollY = typeof event.getScrollY === 'function' ? event.getScrollY() : 0;
        this.setBubbleScrollOffset(this.bubbleScrollOffset - scrollY * 0.25);
    };

    private handleBubbleTouchStart = (event: any): void => {
        const location = typeof event.getUILocation === 'function' ? event.getUILocation() : event.getLocation?.();
        this.touchLastY = location?.y ?? 0;
    };

    private handleBubbleTouchMove = (event: any): void => {
        const location = typeof event.getUILocation === 'function' ? event.getUILocation() : event.getLocation?.();
        const currentY = location?.y ?? this.touchLastY;
        const deltaY = currentY - this.touchLastY;
        this.touchLastY = currentY;
        this.setBubbleScrollOffset(this.bubbleScrollOffset + deltaY);
    };

    private scrollBubblesToBottom(): void {
        this.bubbleScrollOffset = this.getMaxBubbleScrollOffset();
    }

    private setBubbleScrollOffset(value: number): void {
        this.bubbleScrollOffset = Math.max(0, Math.min(this.getMaxBubbleScrollOffset(), value));
        this.relayoutBubbles();
    }

    private relayoutBubbles(): void {
        if (!this.bubbleRoot) {
            return;
        }

        const viewHalfHeight = this.bubbleViewHeight / 2;
        let cursorTop = viewHalfHeight + this.bubbleScrollOffset;

        this.bubbleRoot.children.forEach((bubble) => {
            const transform = bubble.getComponent(UITransform);
            const height = transform?.height ?? 34;
            const centerY = cursorTop - height / 2;
            bubble.setPosition(0, centerY, 0);
            bubble.active = centerY + height / 2 > -viewHalfHeight && centerY - height / 2 < viewHalfHeight;
            cursorTop -= height + this.bubbleGap;
        });
    }

    private getMaxBubbleScrollOffset(): number {
        if (!this.bubbleRoot) {
            return 0;
        }

        const contentHeight = this.bubbleRoot.children.reduce((total, bubble, index) => {
            const height = bubble.getComponent(UITransform)?.height ?? 34;
            return total + height + (index > 0 ? this.bubbleGap : 0);
        }, 0);

        return Math.max(0, contentHeight - this.bubbleViewHeight);
    }

    private unbindInputReturn(): void {
        if (this.boundInputNode) {
            this.boundInputNode.off(EditBox.EventType.EDITING_RETURN, this.handleInputReturn, this);
            this.boundInputNode = null;
        }
    }

    private unbindBubbleScroll(): void {
        if (this.boundBubbleNode) {
            this.boundBubbleNode.off(Node.EventType.MOUSE_WHEEL, this.handleBubbleWheel, this);
            this.boundBubbleNode.off(Node.EventType.TOUCH_START, this.handleBubbleTouchStart, this);
            this.boundBubbleNode.off(Node.EventType.TOUCH_MOVE, this.handleBubbleTouchMove, this);
            this.boundBubbleNode = null;
        }
    }

    private applyArtAssets(): void {
        ArtAssetBinder.applySprite(this.node, 'chatPanel', 650, 500);
        ArtAssetBinder.applyEditBox(this.input);
        ArtAssetBinder.applyProgressBar(this.desireBar);
        const sendButton = this.node.getChildByName('SendButton');
        ArtAssetBinder.applyButton(sendButton, 'secondary');
        this.decorateSendButton(sendButton);
        this.styleChatText();
        this.styleEditBox(this.input);
        if (this.hintButtonNode) {
            ArtAssetBinder.applyButton(this.hintButtonNode, 'small');
            ArtAssetBinder.ensureSpriteNode(this.hintButtonNode, 'HintIcon', 'iconHint', 18, 18, -22, 0, 0);
        }
    }

    private applyCustomerAvatar(customer: CustomerData): void {
        const key = ArtAssetBinder.customerKey(customer.id);
        if (!key) {
            return;
        }

        ArtAssetBinder.ensureSpriteNode(this.node, 'CustomerAvatar', key, 210, 300, -230, 35, 1);
    }

    private decorateSendButton(sendButton: Node | null): void {
        if (!sendButton) {
            return;
        }

        sendButton.getComponent(UITransform)?.setContentSize(150, 52);
        const iconNode = ArtAssetBinder.ensureSpriteNode(sendButton, 'SendIcon', 'iconSend', 34, 34, -42, 0, 0);
        iconNode?.setSiblingIndex(0);

        const label = sendButton.getChildByName('Label')?.getComponent(Label);
        if (!label) {
            return;
        }

        label.node.setPosition(20, 0, 0);
        label.node.getComponent(UITransform)?.setContentSize(86, 34);
        label.color = new Color(255, 248, 232, 255);
        label.fontSize = 24;
        label.lineHeight = 30;
        label.enableWrapText = false;
        label.node.setSiblingIndex(1);
    }

    private styleChatText(): void {
        [this.customerLabel, this.desireLabel].forEach((label) => {
            if (!label) {
                return;
            }

            label.color = new Color(92, 61, 43, 255);
            label.fontSize = 18;
            label.lineHeight = 24;
            label.enableWrapText = true;
        });
    }

    private styleEditBox(editBox: EditBox | null): void {
        if (!editBox) {
            return;
        }

        editBox.placeholder = '';
        editBox.textLabel?.color.set(92, 61, 43, 255);
        editBox.placeholderLabel?.color.set(150, 124, 101, 255);
        if (editBox.placeholderLabel) {
            editBox.placeholderLabel.string = '';
        }
        if (editBox.textLabel) {
            editBox.textLabel.fontSize = 18;
            editBox.textLabel.lineHeight = 28;
        }
        if (editBox.placeholderLabel) {
            editBox.placeholderLabel.fontSize = 18;
            editBox.placeholderLabel.lineHeight = 28;
        }
    }
}
