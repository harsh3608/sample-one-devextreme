import { Component, ElementRef, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import dxButton, { dxButtonOptions } from 'devextreme/ui/button';
import dxCalendar from 'devextreme/ui/calendar';
import dxDateBox from 'devextreme/ui/date_box';
import dxFileUploader from 'devextreme/ui/file_uploader';
import dxSelectBox from 'devextreme/ui/select_box';
import dxTextBox from 'devextreme/ui/text_box';
import { Guid } from 'guid-typescript';
import { Overlay, OverlayOutsideClickDispatcher, OverlayRef } from '@angular/cdk/overlay';
import { Subscription, filter, fromEvent, take } from 'rxjs';
import { TemplatePortal } from '@angular/cdk/portal';
import { DevDataGridService, Fields, Layout, Layouts, editorType } from '../shared/services/dev-data-grid.service';

@Component({
  selector: 'app-build-form',
  templateUrl: './build-form.component.html',
  styleUrls: ['./build-form.component.css']
})
export class BuildFormComponent {
  @ViewChild('componentBody') public componentBody!: ElementRef;
  @ViewChild('userMenu') userMenu!: TemplateRef<any>;
  fields!: Fields[];
  currentItem!: Fields;
  overlayRef!: OverlayRef | null;
  sub!: Subscription;
  currentLayoutData = {
    LayoutName: '' // Initialize with a default value or set it based on your data
  };

  items = [
    { dataField: 'LayoutName' }
  ];

  enteredValue: string = 'Default Layout';


  constructor(private service: DevDataGridService, public overlay: Overlay, public viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {
    this.service.getObjectField(3).subscribe((result) => {
      this.fields = result.map((e: Fields) => { e.draggable = true; return e; });
    })
  }

  ngAfterViewInit() {
    this.createLayout()
  }

  layout: Layouts[] = [];

  componentArray: any = [
    {
      id: 1,
      name: "textBox",
      type: "string"
    },
    {
      id: 2,
      name: "dateTime",
      type: "date"
    },
    {
      id: 3,
      name: "number",
      type: "number"
    }

  ];
  layoutArray: Layout[] = [

  ];
  isDragOver = false;

  onDrop(event: any, id: string) {
    debugger;
    let element = event.srcElement;

    if (element.hasChildNodes()) {
      element = element.querySelector("#" + "insert-div-" + id)
    }

    console.log("onDrop");
    this.isDragOver = false;
    var index = Guid.create().toString();

    const divRef = this.DropComponent(event, index);
    this.layoutArray.push({
      layoutId: id,
      elementRef: divRef.elementRef,
      isField: true,
      id: index,
      option: divRef.options,
      fields: divRef.field
    })
    // this.componentBody.nativeElement.appendChild(divRef.elementRef);
    element.appendChild(divRef.elementRef);

    for (let m = 0; m < 3; m++) {
      var dropableIndex = Guid.create().toString();
      const dropableDivRef = this.createDropingArea(event, dropableIndex)
      this.layoutArray.push({
        layoutId: id,
        elementRef: dropableDivRef,
        isField: false,
        id: dropableIndex,
        option: {},
        fields: {} as Fields
      });
      // this.componentBody.nativeElement.appendChild(dropableDivRef);
      element.appendChild(dropableDivRef);
    }

    this.draggable(false, this.currentItem.id);
    this.currentItem = {} as Fields;
  }

  onDropComponent(event: any, index: string) {
    event.preventDefault();
    event.stopPropagation();

    const component = this.DropComponent(event, index, true);

    let layout = {
      isField: true,
      id: index,
      option: component.options,
      fields: component.field,
      elementRef: component.elementRef
    } as Layout
    this.updateLayout(layout, index)

    this.draggable(false, this.currentItem.id);
    console.log("onDropComponent");
  }

  getMainDiv(index: string) {
    if (this.getLayout(index) != undefined) {
      const elementRef = this.getLayout(index)!.elementRef;
      while (elementRef.firstChild) {
        elementRef.removeChild(elementRef.firstChild);
      }
      return { elementRef: elementRef, field: this.currentItem };
    }
    else {
      const createMainDiv = document.createElement("div");
      createMainDiv.className = "col-xl-6 mb-3"
      createMainDiv.ondrop = (event) => this.onDropComponent(event, index);
      return { elementRef: createMainDiv, field: this.currentItem };
    }
  }


  DropComponent(event: any, index: string, isReplace: boolean = false) {
    let options = {
      placeHolder: this.currentItem.displayName,
      label: this.currentItem.displayName,
    };

    const newComponentElement = document.createElement("div");

    // Create a wrapper div for the label and input element
    //const wrapper = document.createElement("div");
    newComponentElement.style.display = "flex"; // Use flex layout to align label and input horizontally
    //newComponentElement.style.border = "light";

    const label = document.createElement("label");
    label.innerText = `${this.currentItem.displayName} : `;
    newComponentElement.appendChild(label);

    const wrapper = document.createElement("div");

    if (this.currentItem.editorType == editorType[editorType.dxSelectBox]) {
      new dxSelectBox(wrapper, {
        dataSource: this.currentItem.editorOptions?.items,
        displayExpr: "display",
        valueExpr: "value",
      });
    } else if (this.currentItem.editorType == editorType[editorType.dxFileUploader]) {
      new dxFileUploader(wrapper, {});
    } else if (
      this.currentItem.editorType == null ||
      this.currentItem.editorType == editorType[editorType.dxTextBox]
    ) {
      new dxTextBox(wrapper, {
        //placeholder: this.currentItem.displayName,
      });
    } else if (this.currentItem.editorType == editorType[editorType.dxDateBox]) {
      new dxDateBox(wrapper, {});
    }

    newComponentElement.appendChild(wrapper);

    const getMainDiv = this.getMainDiv(index);
    const createMainDiv = getMainDiv.elementRef;
    const btn = document.createElement("div");
    new dxButton(btn, {
      icon: "close",
      onClick: (event) => this.removeElemnt(event, createMainDiv, index),
    });

    newComponentElement.appendChild(btn);

    createMainDiv.appendChild(newComponentElement);
    //createMainDiv.appendChild(btn);

    return { elementRef: createMainDiv, options: options, field: getMainDiv.field };
  }

  createComponent(event: any, index: string) {
    const createMainDiv = document.createElement("div");
    createMainDiv.className = "col-xl-6 mb-3"
    createMainDiv.ondrop = (event) => this.onDropComponent(event, index);

    const newComponentElement = document.createElement("div");
    new dxTextBox(newComponentElement, {
      label: this.currentItem.displayName,
      labelMode: 'floating'
    });
    // const option:dxButtonOptions
    createMainDiv.appendChild(newComponentElement);
    const btn = document.createElement("div")
    new dxButton(btn, {
      icon: 'close',
      onClick: (event) => this.removeElemnt(event, createMainDiv, index)
    });
    createMainDiv.appendChild(btn);

    this.componentBody.nativeElement.appendChild(createMainDiv);

    return createMainDiv
  }





  getDropingAreaElement(event: any, index: string) {
    const createMainDiv = document.createElement("div");
    const child = document.createElement("div");
    createMainDiv.className = "col-xl-6 mb-3"
    child.innerHTML = "Drop Here";
    child.style.border = "dashed";
    createMainDiv.appendChild(child);
    createMainDiv.ondrop = (event) => this.onDropComponent(event, index);
    return createMainDiv
  }

  createDropingArea(event: any, index: string) {
    const createMainDiv = this.getDropingAreaElement(event, index);
    return createMainDiv;
  }

  removeElemnt(event: any, elementRef: any, index: string) {
    while (elementRef.firstChild) {
      elementRef.removeChild(elementRef.firstChild);
    }
    elementRef.className = "col-xl-6 mb-3";
    const child = document.createElement("div");
    child.style.border = 'dashed';
    child.innerHTML = "Drop Here";
    elementRef.appendChild(child);
    elementRef.ondrop = (event: any) => this.onDropComponent(event, index);
    const layout = { elementRef: elementRef, isField: false, option: {}, id: index, fields: {} as Fields } as Layout;
    this.updateLayout(layout, index)
    // elementRef.remove();
  }

  updateLayout(element: Layout, id: string) {
    // Find the index of the element with the specified ID
    const i = this.layoutArray.findIndex((elem) => elem.id === id);

    if (i !== -1) {
      this.layoutArray[i] = element;
    }
  }

  updateLayouts(element: Layouts, id: string) {
    // Find the index of the element with the specified ID
    const i = this.layout.findIndex((elem) => elem.id === id);

    if (i !== -1) {
      this.layout[i] = element;
    }
    console.log(this.layout);
  }
  getLayouts(id: string): Layouts {
    // Find the index of the element with the specified ID
    const i = this.layout.findIndex((elem) => elem.id === id);

    if (i !== -1) {
      return this.layout[i];
    }
    return {} as Layouts;
  }
  getLayout(id: string) {
    // Find the index of the element with the specified ID
    const i = this.layoutArray.findIndex((elem) => elem.id === id);

    if (i !== -1) {
      return this.layoutArray[i];
    }
    return
  }


  onDragStart(item: any) {
    console.log("onDragStart");
    this.currentItem = item;
  }
  onDragEnd(event: any) {
    console.log("onDragEnd");
    this.isDragOver = false;
    this.currentItem = {} as Fields;

  }
  onDragOverList(event: any) {
    event.preventDefault();
  }
  onDragEnter(event: any) {
    this.isDragOver = true;
  }
  onDragExit(event: any) {
    this.isDragOver = false;
  }



  InsertObject(list: any[], objectToInsert: any, indexToInsert: string) {
    const index = this.layoutArray.findIndex(item => item.id === indexToInsert);
    list.splice(index, 0, objectToInsert);
  }

  createCustomText() {

  }

  createLayout() {
    let id = Guid.create().toString();

    const createLayoutDiv = document.createElement("div");
    createLayoutDiv.className = "col-xl-12 mb-1 card p-1 h-120px"
    let layout = { elementRef: createLayoutDiv, id: id, layoutName: "Category" } as Layouts

    const head = document.createElement("div");
    head.className = "d-flex flex-row justify-content-between";


    const cardbody = document.createElement("div");
    cardbody.className = "card-body";
    const cardTitle = document.createElement("h5");
    cardTitle.className = "card-title";
    cardTitle.id = "card-title-" + id;
    cardbody.appendChild(cardTitle);
    head.appendChild(cardTitle);


    const button = document.createElement("div");
    new dxButton(button, {
      icon: 'overflow',
      onClick: (event) => this.open(event, layout),
      type:"normal",
      stylingMode:"outlined",
    });
    //createLayoutDiv.appendChild(button);
    head.appendChild(button);

    const div = document.createElement("div");
    div.className = "row";
    div.id = "insert-div-" + id;
    cardbody.appendChild(div);

    createLayoutDiv.appendChild(head);
    createLayoutDiv.appendChild(cardbody);

    createLayoutDiv.ondragover = (event) => this.onDragOverList(event);
    createLayoutDiv.ondrop = (event) => this.onDrop(event, id);
    createLayoutDiv.ondragenter = (event) => this.onDragEnter(event);
    createLayoutDiv.ondragleave = (event) => this.onDragExit(event);
    //createLayoutDiv.oncontextmenu = (event) => this.open(event, event, layout);

    this.componentBody.nativeElement.appendChild(createLayoutDiv);
    this.layout.push(layout);

  }

  submit() {
    console.log(this.layoutArray);
  }

  draggable(status: boolean, id: string) {
    this.fields = this.fields.filter(x => x.id !== id);
    // let item = this.fields?.find((item) => item.id == id)
    // if (item) {
    //   item.draggable = status;
    // }
  }

  //open({ x, y }: MouseEvent, e: any, layout: Layouts) {
  open(clickEvent: any, layout: Layouts) {
    debugger;
    this.close();
    // clickEvent.preventDefault();
    this.currentLayoutData.LayoutName = layout.layoutName;
    console.log(layout);

    // Calculate the center of the screen
    const centerX = 850;
    const centerY = 300;

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x: centerX, y: centerY })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.userMenu, this.viewContainerRef, {
      $implicit: layout
    }));

    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(event => {
          const clickTarget = event.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe({})
  }

  close() {
    this.sub && this.sub.unsubscribe();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  updateLayoutName(layout: Layouts, currentLayoutData: any) {
    let id = layout.id;
    let layoutName = currentLayoutData.LayoutName;
    console.log(currentLayoutData);
    const elementId = document.getElementById("card-title-" + id);
    if (elementId) {
      elementId.innerHTML = layoutName;
      const l = this.getLayouts(id);
      l.layoutName = layoutName;
      currentLayoutData.LayoutName = "";
      this.updateLayouts(l, id)
      this.close();
    }
  }

  // onValueChanged(e: any) {
  //   this.enteredValue = e.value;
  //   this.currentLayoutData.LayoutName = this.enteredValue;
  // }


}
