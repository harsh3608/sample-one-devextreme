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
import { DevDataGridService, Fields, Category, Categories, editorType } from '../shared/services/dev-data-grid.service';

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
    categoryName: '' // Initialize with a default value or set it based on your data
  };
  items = [
    { dataField: 'LayoutName' }
  ];
  enteredValue: string = 'Default Layout';


  constructor(private service: DevDataGridService, public overlay: Overlay, public viewContainerRef: ViewContainerRef, private elementRef: ElementRef) {
    this.service.getObjectField(3).subscribe((result) => {
      this.fields = result.map((e: Fields) => { e.draggable = true; return e; });
      this.fields.splice(0, 0,
        {
          id: '22',
          objectId: 3,
          fieldName: 'CustomText',
          displayName: 'Custom Text',
          width: 'auto',
          dataType: 'string',
          format: '',
          isVisible: true,
          editorType: 'dxAutocomplete',
          validationOption: [],
          draggable: true
        }
      );
      console.log(this.fields);
    });


  }

  ngAfterViewInit() {
    this.createCategory()
  }

  categories: Categories[] = [];

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
  layoutArray: Category[] = [

  ];
  isDragOver = false;

  onDrop(event: any, id: string, categoryName: string) {
    let element = event.srcElement;

    if (element.hasChildNodes()) {
      element = element.querySelector("#" + "insert-div-" + id)
    }

    console.log("onDrop");
    this.isDragOver = false;
    var index = Guid.create().toString();

    const divRef = this.DropComponent(event, index);
    this.layoutArray.push({
      categoryId: id,
      elementRef: divRef.elementRef,
      isField: true,
      id: index,
      option: divRef.options,
      fields: divRef.field,
      categoryName: categoryName
    })
    // this.componentBody.nativeElement.appendChild(divRef.elementRef);
    element?.appendChild(divRef.elementRef);

    for (let m = 0; m < 3; m++) {
      var dropableIndex = Guid.create().toString();
      const dropableDivRef = this.createDropingArea(event, dropableIndex)
      this.layoutArray.push({
        categoryId: id,
        elementRef: dropableDivRef,
        isField: false,
        id: dropableIndex,
        option: {},
        fields: {} as Fields,
        categoryName: categoryName
      });
      // this.componentBody.nativeElement.appendChild(dropableDivRef);
      element?.appendChild(dropableDivRef);
    }

    this.draggable(false, this.currentItem.id);
    this.currentItem = {} as Fields;
  }

  onDropComponent(event: any, index: string) {
    event.preventDefault();
    event.stopPropagation();

    const category = this.getLayout(index);
    const component = this.DropComponent(event, index, true);

    let element = event.srcElement;
    if (element.hasChildNodes()) {
      const id = category?.categoryId;
      element.querySelector("#" + "insert-div-" + id);
    }

    let layout = {
      isField: true,
      id: index,
      option: component.options,
      fields: component.field,
      elementRef: component.elementRef,
      categoryName: category?.categoryName,
      categoryId: category?.categoryId
    } as Category
    this.draggable(false, this.currentItem.id);

    const emptyFields = this.layoutArray.filter(field => field.categoryId == category?.categoryId && field.isField == false);

    if (emptyFields.length === 2) {
      for (let m = 0; m < 2; m++) {
        var dropableIndex = Guid.create().toString();
        const dropableDivRef = this.createDropingArea(event, dropableIndex)
        this.layoutArray.push({
          categoryId: category?.categoryId || '',
          elementRef: dropableDivRef,
          isField: false,
          id: dropableIndex,
          option: {},
          fields: {} as Fields,
          categoryName: category?.categoryName || ''
        });
        event.currentTarget.parentNode?.appendChild(dropableDivRef);
      }

    }
    this.updateLayout(layout, index);
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
    newComponentElement.style.display = "flex"; // Use flex layout to align label and input horizontally
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
      new dxTextBox(wrapper, {});
    } else if (this.currentItem.editorType == editorType[editorType.dxDateBox]) {
      new dxDateBox(wrapper, {});
    } else {
      var emptyDiv = document.createElement('div');
      emptyDiv.style.width = '200px';
      wrapper.appendChild(emptyDiv);
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
    const layout = { elementRef: elementRef, isField: false, option: {}, id: index, fields: {} as Fields } as Category;
    this.updateLayout(layout, index)
    // elementRef.remove();
  }

  updateLayout(element: Category, id: string) {
    // Find the index of the element with the specified ID
    const i = this.layoutArray.findIndex((elem) => elem.id === id);
    //to update fields table
    const fieldObjectId = this.layoutArray[i].fields.objectId;
    const fieldId = this.layoutArray[i].fields.id;
    if (element.isField == false) {
      this.updateFields(fieldObjectId, fieldId);
    };

    if (i !== -1) {
      this.layoutArray[i] = element;
    };
  }

  //to Update Fields on Removal of layout field
  updateFields(objectId: number, id: string) {
    this.service.getObjectField(objectId).subscribe(
      (res) => {
        const fields = res.map((e: Fields) => { e.draggable = true; return e; });
        const filteredFields = fields.filter(field => field.id == id);
        if (id !== '22') {
          this.fields.push(filteredFields[0]);
        };
      }
    );
  }

  updateLayouts(element: Categories, id: string) {
    // Find the index of the element with the specified ID
    const i = this.categories.findIndex((elem) => elem.id === id);
    if (i !== -1) {
      this.categories[i] = element;
    }
  }

  getLayouts(id: string): Categories {
    // Find the index of the element with the specified ID
    const i = this.categories.findIndex((elem) => elem.id === id);

    if (i !== -1) {
      return this.categories[i];
    }
    return {} as Categories;
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
    // sessionStorage.setItem('src-element',JSON.stringify(event.srcElement));
    // console.log((event));

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

  createCategory() {
    let id = Guid.create().toString();

    const createLayoutDiv = document.createElement("div");
    createLayoutDiv.className = "col-xl-12 mb-1 card p-1 h-120px"
    let category = { elementRef: createLayoutDiv, id: id, categoryName: "Default Category" } as Categories

    const head = document.createElement("div");
    head.className = "d-flex flex-row justify-content-between";


    const cardbody = document.createElement("div");
    cardbody.className = "card-body";
    const cardTitle = document.createElement("h5");
    cardTitle.innerHTML = "Default Category"
    cardTitle.className = "card-title";
    cardTitle.id = "card-title-" + id;
    cardbody.appendChild(cardTitle);
    head.appendChild(cardTitle);


    const button = document.createElement("div");
    new dxButton(button, {
      icon: 'overflow',
      onClick: (event) => this.open(event, category),
      type: "normal",
      stylingMode: "outlined",
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
    createLayoutDiv.ondrop = (event) => this.onDrop(event, id, category.categoryName);
    createLayoutDiv.ondragenter = (event) => this.onDragEnter(event);
    createLayoutDiv.ondragleave = (event) => this.onDragExit(event);

    this.componentBody.nativeElement.appendChild(createLayoutDiv);
    this.categories.push(category);

  }

  submit() {
    this.groupAndOrganizeObjects(this.layoutArray);
  }

  groupAndOrganizeObjects(layoutArray: Category[]) {
    const groupedObjects: { [key: string]: Category[] } = {};
    layoutArray.forEach((obj) => {
      const { categoryId, categoryName, ...rest } = obj;
      if (!groupedObjects[categoryId]) {
        groupedObjects[categoryId] = [];
      }
      groupedObjects[categoryId].push({ categoryId, categoryName, ...rest });
    });
    this.replaceKeysWithCategoryNames(groupedObjects);
    return groupedObjects;
  }

  replaceKeysWithCategoryNames(data: any): any {
    const result: any = {};
    for (const categoryId in data) {
      if (data.hasOwnProperty(categoryId)) {
        // Find the corresponding category by ID
        const category = this.categories.find(category => category.id === categoryId);

        if (category) {
          const categoryName = category.categoryName;
          // Replace the key with the category name
          result[categoryName] = data[categoryId];

          // Update the category name for all objects in the array
          if (Array.isArray(result[categoryName])) {
            result[categoryName] = result[categoryName].map((item: any) => {
              return { ...item, categoryName };
            });
          }
        } else {
          // If no matching category is found, keep the original key
          result[categoryId] = data[categoryId];
        }
      }
    }
    console.log(result);
    return result;
  }


  draggable(status: boolean, id: string) {
    if (id !== '22') {
      this.fields = this.fields.filter(x => x.id !== id);
    }

  }

  open(clickEvent: any, layout: Categories) {
    this.close();
    // clickEvent.preventDefault();
    this.currentLayoutData.categoryName = layout.categoryName;
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

  updateLayoutName(layout: Categories, currentLayoutData: any) {
    let id = layout.id;
    let layoutName = currentLayoutData.categoryName;
    const elementId = document.getElementById("card-title-" + id);
    if (elementId) {
      elementId.innerHTML = layoutName;
      const l = this.getLayouts(id);
      l.categoryName = layoutName;
      currentLayoutData.LayoutName = "";
      this.updateLayouts(l, id)
      this.close();
    }
  }



}
