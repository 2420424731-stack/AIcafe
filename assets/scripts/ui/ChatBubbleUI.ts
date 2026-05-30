import { _decorator, Color, Component, Label, UITransform } from 'cc';
import { ArtAssetBinder } from './ArtAssetBinder';

const { ccclass, property } = _decorator;

export enum ChatRole {
    Player = 'player',
    Customer = 'customer',
    System = 'system',
}

@ccclass('ChatBubbleUI')
export class ChatBubbleUI extends Component {
    @property(Label)
    contentLabel: Label | null = null;

    setup(role: ChatRole, content: string): void {
        const text = `${this.getRoleName(role)}：${content}`;
        ArtAssetBinder.applySprite(this.node, this.getBubbleArtKey(role));
        if (this.contentLabel) {
            this.contentLabel.string = text;
            this.contentLabel.fontSize = 16;
            this.contentLabel.lineHeight = 22;
            this.contentLabel.color = new Color(58, 45, 36, 255);
            this.contentLabel.enableWrapText = true;
        }

        this.resizeBubble(text);
    }

    private resizeBubble(text: string): void {
        const width = 560;
        const lineCount = Math.max(1, Math.ceil(text.length / 28));
        const height = Math.max(34, lineCount * 22 + 10);

        this.node.getComponent(UITransform)?.setContentSize(width, height);
        this.contentLabel?.node.getComponent(UITransform)?.setContentSize(width - 20, height);
    }

    private getRoleName(role: ChatRole): string {
        if (role === ChatRole.Player) return '店长';
        if (role === ChatRole.Customer) return '顾客';
        return '系统';
    }

    private getBubbleArtKey(role: ChatRole): 'bubblePlayer' | 'bubbleCustomer' | 'bubbleSystem' {
        if (role === ChatRole.Player) return 'bubblePlayer';
        if (role === ChatRole.Customer) return 'bubbleCustomer';
        return 'bubbleSystem';
    }
}
