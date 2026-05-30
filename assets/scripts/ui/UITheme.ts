import { Button, Color, EditBox, Graphics, Label, Node, Sprite, UITransform } from 'cc';

export class UITheme {
    static readonly Ink = new Color(45, 39, 48, 255);
    static readonly Muted = new Color(117, 108, 114, 255);
    static readonly Paper = new Color(255, 248, 234, 245);
    static readonly Panel = new Color(255, 250, 239, 232);
    static readonly Coffee = new Color(180, 85, 77, 255);
    static readonly Teal = new Color(47, 111, 115, 255);
    static readonly Gold = new Color(214, 154, 59, 255);
    static readonly Dark = new Color(39, 51, 63, 255);
    static readonly Line = new Color(118, 93, 80, 120);
    static readonly White = new Color(255, 255, 255, 255);

    static size(node: Node | null, width: number, height: number): void {
        if (!node) {
            return;
        }

        const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
        transform.setContentSize(width, height);
    }

    static label(label: Label | null, fontSize: number, color: Color = UITheme.Ink, width?: number, height?: number): void {
        if (!label) {
            return;
        }

        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.35);
        label.color = color;
        label.enableWrapText = true;

        if (width && height) {
            UITheme.size(label.node, width, height);
        }
    }

    static button(node: Node | null, width: number, height: number, fill: Color = UITheme.Teal, labelColor: Color = UITheme.White): void {
        if (!node) {
            return;
        }

        UITheme.size(node, width, height);
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            sprite.color = fill;
        }

        const button = node.getComponent(Button);
        if (button) {
            button.normalColor = fill;
            button.hoverColor = new Color(
                Math.min(fill.r + 18, 255),
                Math.min(fill.g + 18, 255),
                Math.min(fill.b + 18, 255),
                fill.a,
            );
            button.pressedColor = new Color(
                Math.max(fill.r - 18, 0),
                Math.max(fill.g - 18, 0),
                Math.max(fill.b - 18, 0),
                fill.a,
            );
        }

        node.children.forEach((child) => {
            const childLabel = child.getComponent(Label);
            if (childLabel) {
                UITheme.label(childLabel, 20, labelColor, width - 12, height);
            }
        });
    }

    static editBox(editBox: EditBox | null, width: number, height: number): void {
        if (!editBox) {
            return;
        }

        UITheme.size(editBox.node, width, height);
        const sprite = editBox.node.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255, 215);
        }
    }

    static panel(node: Node | null, width: number, height: number, fill: Color = UITheme.Panel, radius = 14): void {
        if (!node) {
            return;
        }

        UITheme.size(node, width, height);
        let background = node.getChildByName('__theme_bg');
        if (!background) {
            background = new Node('__theme_bg');
            node.addChild(background);
        }

        background.setSiblingIndex(0);
        background.setPosition(0, 0, 0);
        UITheme.size(background, width, height);

        const graphics = background.getComponent(Graphics) ?? background.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = fill;
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.fill();
        graphics.strokeColor = UITheme.Line;
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.stroke();
    }

    static setChildPosition(parent: Node | null, childName: string, x: number, y: number): Node | null {
        const child = parent?.getChildByName(childName) ?? null;
        child?.setPosition(x, y, 0);
        return child;
    }
}
