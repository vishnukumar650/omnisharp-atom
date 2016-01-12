let fastdom: typeof Fastdom = require("fastdom");
const _: _.LoDashStatic = require("lodash");

export interface MessageElement<TItem> extends HTMLLIElement {
    key: string;
    selected: boolean;
    setMessage(key: string, item: TItem): void;
    item: TItem;
}

export class OutputElement<TItem, TElement extends MessageElement<TItem>> extends HTMLOListElement implements WebComponent {
    private output: TItem[];
    private _selectedKey: string;
    private _selectedIndex: number;
    private _selectedElement: TElement;
    private _update: () => void;

    public createdCallback() {
        this.output = [];
        this.classList.add("messages-container", "ol");
        const parent = this;
        const onclickHandler = function(e: UIEvent) {
            parent.selected = this.key;
            parent.handleClick(this.item);
        };

        this._update = _.throttle(() => {
            fastdom.mutate(() => {
                for (let i = 0, len = this.children.length > this.output.length ? this.children.length : this.output.length; i < len; i++) {
                    const item = this.output[i];
                    let child: TElement = <any>this.children[i];

                    if (!item && child) {
                        this.removeChild(child);
                        continue;
                    } else if (item && !child) {
                        child = this.elementFactory();
                        child.onclick = onclickHandler;
                        this.appendChild(child);
                    }

                    if (item && child) {
                        const key = this.getKey(item);
                        if (child.key !== key) {
                            child.setMessage(key, item);
                            child.item = item;
                        }
                    }

                    if (child) {
                        if (child.key === this._selectedKey && !child.selected) {
                            child.selected = true;
                        } else if (child.selected) {
                            child.selected = false;
                        }
                    }
                }

                this.scrollToItemView();
            });
        }, 100, { trailing: true });
    }

    public attachedCallback() {
        this.scrollTop = $(this).scrollTop();
        this.onkeydown = (e: any) => this.keydownPane(e);
    }

    public getKey: (message: TItem) => string;
    public eventName: string;
    public handleClick: (item: TItem) => void;
    public elementFactory: () => TElement;

    public get selected() { return this._selectedKey; }
    public set selected(value: string) {
        const index = _.findIndex(this.children, (e: TElement) => e.key === value);
        if (index) {
            const e: TElement = <any>this.children[index];
            this._selectedKey = value;
            this._selectedIndex = index;
            if (this._selectedElement) {
                this._selectedElement.selected = false;
            }
            this._selectedElement = e;
            e.selected = true;
        }
    }

    public get selectedIndex() { return this._selectedIndex; }
    public set selectedIndex(index) {
        const e: TElement = <any>this.children[index];
        if (e) {
            this.selected = e.key;
        }
    }

    public get current() { return this.output[this._selectedIndex]; }

    public next() {
        this.selectedIndex = this._selectedIndex + 1;
    }

    public prev() {
        this.selectedIndex = this._selectedIndex - 1;
    }

    public updateOutput(output: TItem[]) {
        this.output = output.slice();
        this._update();
    }

    public detachedCallback() {
        this.onkeydown = undefined;
    }

    private keydownPane(e: any) {
        if (e.keyIdentifier === "Down") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:next-${this.eventName}`);
        } else if (e.keyIdentifier === "Up") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:previous-${this.eventName}`);
        } else if (e.keyIdentifier === "Enter") {
            atom.commands.dispatch(atom.views.getView(atom.workspace), `omnisharp-atom:go-to-${this.eventName}`);
        }
    }

    private scrollToItemView() {
        const self = $(this);
        const item = self.find(`.selected`);
        if (!item || !item.position()) return;

        const pane = self;
        const scrollTop = pane.scrollTop();
        const desiredTop = item.position().top + scrollTop;
        const desiredBottom = desiredTop + item.outerHeight();

        if (desiredTop < scrollTop) {
            pane.scrollTop(desiredTop);
        } else if (desiredBottom > pane.scrollTop() + item.outerHeight()) {
            pane.scrollTop(desiredBottom + item.outerHeight());
        }
    }
}

(<any>exports).OutputElement = (<any>document).registerElement("omnisharp-output-list", { prototype: OutputElement.prototype });
