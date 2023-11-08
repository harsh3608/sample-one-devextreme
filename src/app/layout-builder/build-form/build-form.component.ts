import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import dxButton, { dxButtonOptions } from 'devextreme/ui/button';
import dxCalendar from 'devextreme/ui/calendar';
import dxDateBox from 'devextreme/ui/date_box';
import dxFileUploader from 'devextreme/ui/file_uploader';
import dxSelectBox from 'devextreme/ui/select_box';
import dxTextBox from 'devextreme/ui/text_box';
import { Guid } from 'guid-typescript';
import {
  Overlay,
  OverlayOutsideClickDispatcher,
  OverlayRef,
} from '@angular/cdk/overlay';
import { Subscription, filter, fromEvent, take } from 'rxjs';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  DevDataGridService,
  Fields,
  Category,
  Categories,
  editorType,
  EditorOptions,
  ObjectList,
} from '../shared/services/dev-data-grid.service';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-build-form',
  templateUrl: './build-form.component.html',
  styleUrls: ['./build-form.component.css'],
})
export class BuildFormComponent implements OnInit {
  @ViewChild('componentBody') public componentBody!: ElementRef;
  @ViewChild('userMenu') userMenu!: TemplateRef<any>;
  @ViewChild('deleteMenu') deleteMenu!: TemplateRef<any>;
  fields!: Fields[];
  currentItem!: Fields;
  overlayRef!: OverlayRef | null;
  sub!: Subscription;
  currentLayoutData = {
    categoryName: '', // Initialize with a default value or set it based on your data
  };
  items = [{ dataField: 'LayoutName' }];
  enteredValue: string = 'Default Layout';
  showObjectListPanel: boolean = false;
  // currentObjectList: ObjectList = {
  //   id: '',
  //   elementRef: null,
  //   isObjectList: true,
  //   object: '123',
  //   view: '10',
  //   linkPointToPopup: true,
  //   FriendlyName: 'select object'
  // };
  currentObjectList!: ObjectList;

  // @ViewChild('renameCustomText', { static: false }) renameCustomText!: ElementRef;
  // @HostListener('document:click', ['$event'])
  // documentClick(event: Event) {
  //   debugger;
  //   if (
  //     this.renameCustomText &&
  //     this.renameCustomText.nativeElement.id !== 'customField'
  //   ) {
  //     this.showRenameCustomText = false;
  //   }
  // }
  objects: any[] = [
    {
      display: 'Broker Issue - Statement Transaction',
      value: '123',
    },
    {
      display: 'Broker Issue - Transaction Failed',
      value: '345',
    },
    {
      display: 'Broker Issue - Account Transaction',
      value: '678',
    },
  ];

  views: any[] = [
    {
      display: 'Active Broker Issues',
      value: '10',
    },
    {
      display: 'Active Broker Issues FT',
      value: '20',
    },
    {
      display: 'Active Broker Issues ST',
      value: '30',
    },
    {
      display: 'All Broker Issue',
      value: '40',
    },
    {
      display: 'All Broker Issue with Deleted',
      value: '50',
    },
    {
      display: 'Broker Issue - Account Transaction',
      value: '60',
    },
  ];
  ObjectListForm!: FormGroup
  booleans: boolean[] = [true, false];





  constructor(
    private service: DevDataGridService,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    private elementRef: ElementRef
  ) {
    this.service.getObjectField(3).subscribe((result) => {
      this.fields = result.map((e: Fields) => {
        e.draggable = true;
        return e;
      });
      this.fields.splice(0, 0, {
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
        draggable: true,
      });
    });
  }

  ngOnInit(): void {

    this.ObjectListForm = new FormGroup({
      id: new FormControl(),
      elementRef: new FormControl(),
      isObjectList: new FormControl(),
      object: new FormControl(),
      view: new FormControl(),
      linkPointToPopup: new FormControl(),
      friendlyName: new FormControl()
    });
  }

  ngAfterViewInit() {
    this.createCategory();
  }

  categories: Categories[] = [];

  componentArray: any = [
    {
      id: 1,
      name: 'textBox',
      type: 'string',
    },
    {
      id: 2,
      name: 'dateTime',
      type: 'date',
    },
    {
      id: 3,
      name: 'number',
      type: 'number',
    },
  ];
  layoutArray: any[] = [];
  isDragOver = false;

  onDrop(event: any, id: string, categoryName: string) {
    let element = event.srcElement;

    if (element.hasChildNodes()) {
      element = element.querySelector('#' + 'insert-div-' + id);
    }

    console.log('onDrop');
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
      categoryName: categoryName,
    });
    // this.componentBody.nativeElement.appendChild(divRef.elementRef);
    element?.appendChild(divRef.elementRef);

    for (let m = 0; m < 3; m++) {
      var dropableIndex = Guid.create().toString();
      const dropableDivRef = this.createDropingArea(event, dropableIndex);
      this.layoutArray.push({
        categoryId: id,
        elementRef: dropableDivRef,
        isField: false,
        id: dropableIndex,
        option: {},
        fields: {} as Fields,
        categoryName: categoryName,
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
      element.querySelector('#' + 'insert-div-' + id);
    }

    let layout = {
      isField: true,
      id: index,
      option: component.options,
      fields: component.field,
      elementRef: component.elementRef,
      categoryName: category?.categoryName,
      categoryId: category?.categoryId,
    } as Category;
    this.draggable(false, this.currentItem.id);

    const emptyFields = this.layoutArray.filter(
      (field) =>
        field.categoryId == category?.categoryId && field.isField == false
    );

    if (emptyFields.length === 2) {
      for (let m = 0; m < 2; m++) {
        var dropableIndex = Guid.create().toString();
        const dropableDivRef = this.createDropingArea(event, dropableIndex);
        this.layoutArray.push({
          categoryId: category?.categoryId || '',
          elementRef: dropableDivRef,
          isField: false,
          id: dropableIndex,
          option: {},
          fields: {} as Fields,
          categoryName: category?.categoryName || '',
        });
        event.currentTarget.parentNode?.appendChild(dropableDivRef);
      }
    }
    this.updateLayout(layout, index);
    console.log('onDropComponent');
  }

  getMainDiv(index: string) {
    if (this.getLayout(index) != undefined) {
      const elementRef = this.getLayout(index)!.elementRef;
      while (elementRef.firstChild) {
        elementRef.removeChild(elementRef.firstChild);
      }
      return { elementRef: elementRef, field: this.currentItem };
    } else {
      const createMainDiv = document.createElement('div');
      createMainDiv.className = 'col-xl-6 mb-3';
      createMainDiv.ondrop = (event) => this.onDropComponent(event, index);
      return { elementRef: createMainDiv, field: this.currentItem };
    }
  }

  DropComponent(event: any, index: string, isReplace: boolean = false) {
    let options = {
      placeHolder: this.currentItem.displayName,
      label: this.currentItem.displayName,
    };
    const newComponentElement = document.createElement('div');
    // Create a wrapper div for the label and input element
    newComponentElement.style.display = 'flex'; // Use flex layout to align label and input horizontally
    const label = document.createElement('label');
    label.innerText = `${this.currentItem.displayName} : `;
    newComponentElement.appendChild(label);
    const wrapper = document.createElement('div');

    if (this.currentItem.editorType == editorType[editorType.dxSelectBox]) {
      new dxSelectBox(wrapper, {
        dataSource: this.currentItem.editorOptions?.items,
        displayExpr: 'display',
        valueExpr: 'value',
      });
    } else if (
      this.currentItem.editorType == editorType[editorType.dxFileUploader]
    ) {
      new dxFileUploader(wrapper, {});
    } else if (
      this.currentItem.editorType == null ||
      this.currentItem.editorType == editorType[editorType.dxTextBox]
    ) {
      new dxTextBox(wrapper, {});
    } else if (
      this.currentItem.editorType == editorType[editorType.dxDateBox]
    ) {
      new dxDateBox(wrapper, {});
    } else {
      var emptyDiv = document.createElement('div');
      emptyDiv.style.width = '200px';
      wrapper.appendChild(emptyDiv);

      // Add click event to label for making it editable
      label.addEventListener('click', () => {
        // Get the current text from the label
        const labelText = label.innerText;
        // Create an input element for editing the label
        const input = document.createElement('input');
        input.type = 'text';
        input.value = labelText.substring(0, labelText.length - 2); // Remove ": " from the label text
        label.style.display = 'none'; // Hide the label
        newComponentElement.appendChild(input);

        input.addEventListener('blur', () => {
          const updatedText = input.value;
          label.innerText = `${updatedText} : `;
          label.style.display = 'inline'; // Show the label again
          input.remove(); // Remove the input element
        });

        input.focus(); // Focus on the input for editing
      });

      // newComponentElement.id = 'customField';
      // newComponentElement.onclick = () => this.createCustomText(event);
    }

    newComponentElement.appendChild(wrapper);

    const getMainDiv = this.getMainDiv(index);
    const createMainDiv = getMainDiv.elementRef;
    const btn = document.createElement('div');
    new dxButton(btn, {
      icon: 'close',
      onClick: (event) => this.removeElemnt(event, createMainDiv, index),
    });

    newComponentElement.appendChild(btn);

    createMainDiv.appendChild(newComponentElement);
    //createMainDiv.appendChild(btn);

    return {
      elementRef: createMainDiv,
      options: options,
      field: getMainDiv.field,
    };
  }

  createComponent(event: any, index: string) {
    const createMainDiv = document.createElement('div');
    createMainDiv.className = 'col-xl-6 mb-3';
    createMainDiv.ondrop = (event) => this.onDropComponent(event, index);
    const newComponentElement = document.createElement('div');
    new dxTextBox(newComponentElement, {
      label: this.currentItem.displayName,
      labelMode: 'floating',
    });
    createMainDiv.appendChild(newComponentElement);
    const btn = document.createElement('div');
    new dxButton(btn, {
      icon: 'close',
      onClick: (event) => this.removeElemnt(event, createMainDiv, index),
    });
    createMainDiv.appendChild(btn);
    this.componentBody.nativeElement.appendChild(createMainDiv);
    return createMainDiv;
  }

  getDropingAreaElement(event: any, index: string) {
    const createMainDiv = document.createElement('div');
    const child = document.createElement('div');
    createMainDiv.className = 'col-xl-6 mb-3';
    child.innerHTML = 'Drop Here';
    child.style.border = 'dashed';
    createMainDiv.appendChild(child);
    createMainDiv.ondrop = (event) => this.onDropComponent(event, index);
    return createMainDiv;
  }

  createDropingArea(event: any, index: string) {
    const createMainDiv = this.getDropingAreaElement(event, index);
    return createMainDiv;
  }

  removeElemnt(event: any, elementRef: any, index: string) {
    while (elementRef.firstChild) {
      elementRef.removeChild(elementRef.firstChild);
    }
    elementRef.className = 'col-xl-6 mb-3';
    const child = document.createElement('div');
    child.style.border = 'dashed';
    child.innerHTML = 'Drop Here';
    elementRef.appendChild(child);
    elementRef.ondrop = (event: any) => this.onDropComponent(event, index);
    const layout = {
      elementRef: elementRef,
      isField: false,
      option: {},
      id: index,
      fields: {} as Fields,
    } as Category;
    this.updateLayout(layout, index);
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
    }

    if (i !== -1) {
      this.layoutArray[i] = element;
    }
  }

  //to Update Fields on Removal of layout field
  updateFields(objectId: number, id: string) {
    this.service.getObjectField(objectId).subscribe((res) => {
      const fields = res.map((e: Fields) => {
        e.draggable = true;
        return e;
      });
      const filteredFields = fields.filter((field) => field.id == id);
      if (id !== '22') {
        this.fields.push(filteredFields[0]);
      }
    });
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
    return;
  }

  onDragStart(item: any) {
    console.log('onDragStart');
    this.currentItem = item;
  }
  onDragEnd(event: any) {
    console.log('onDragEnd');
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
    const index = this.layoutArray.findIndex(
      (item) => item.id === indexToInsert
    );
    list.splice(index, 0, objectToInsert);
  }

  createCategory() {
    this.showObjectListPanel = false;
    let id = Guid.create().toString();

    const createLayoutDiv = document.createElement('div');
    createLayoutDiv.className = 'col-xl-12 mb-1 card p-1 h-120px';
    let category = {
      elementRef: createLayoutDiv,
      id: id,
      categoryName: 'Default Category',
    } as Categories;

    const head = document.createElement('div');
    head.className = 'd-flex flex-row justify-content-between';

    const cardbody = document.createElement('div');
    cardbody.className = 'card-body';
    const cardTitle = document.createElement('h5');
    cardTitle.innerHTML = 'Default Category';
    cardTitle.className = 'card-title';
    cardTitle.id = 'card-title-' + id;
    cardbody.appendChild(cardTitle);
    head.appendChild(cardTitle);

    const buttons = document.createElement('div');

    const button = document.createElement('div');
    new dxButton(button, {
      icon: 'overflow',
      onClick: (event) => this.open(event, category),
      type: 'normal',
      stylingMode: 'outlined',
    });
    //createLayoutDiv.appendChild(button);
    buttons.appendChild(button);

    const deleteButton = document.createElement('div');
    new dxButton(deleteButton, {
      icon: 'close',
      onClick: (event) => this.openDeleteModal(event, category),
      type: 'normal',
      stylingMode: 'outlined',
    });
    //createLayoutDiv.appendChild(button);
    buttons.appendChild(deleteButton);
    head.appendChild(buttons);

    const div = document.createElement('div');
    div.className = 'row';
    div.id = 'insert-div-' + id;
    cardbody.appendChild(div);

    createLayoutDiv.appendChild(head);
    createLayoutDiv.appendChild(cardbody);

    createLayoutDiv.ondragover = (event) => this.onDragOverList(event);
    createLayoutDiv.ondrop = (event) =>
      this.onDrop(event, id, category.categoryName);
    createLayoutDiv.ondragenter = (event) => this.onDragEnter(event);
    createLayoutDiv.ondragleave = (event) => this.onDragExit(event);

    this.componentBody?.nativeElement.appendChild(createLayoutDiv);
    this.categories.push(category);
  }

  submit() {
    console.log(this.layoutArray);
    this.groupAndOrganizeObjects(this.layoutArray);
  }

  groupAndOrganizeObjects(layoutArray: any[]) {
    const groupedObjects: { [key: string]: Category[] } = {};
    groupedObjects['ObjectList'] = [];
    layoutArray.forEach((obj) => {
      const { categoryId, categoryName, ...rest } = obj;

      if (obj.isObjectList) {
        groupedObjects['ObjectList'].push(obj);
      } else {
        if (!groupedObjects[categoryId]) {
          groupedObjects[categoryId] = [];
        }
        groupedObjects[categoryId].push({ categoryId, categoryName, ...rest });
      }
    });
    this.replaceKeysWithCategoryNames(groupedObjects);
    return groupedObjects;
  }

  replaceKeysWithCategoryNames(data: any): any {
    const result: any = {};
    for (const categoryId in data) {
      if (data.hasOwnProperty(categoryId)) {
        // Find the corresponding category by ID
        const category = this.categories.find(
          (category) => category.id === categoryId
        );

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
      this.fields = this.fields.filter((x) => x.id !== id);
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

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: centerX, y: centerY })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    this.overlayRef.attach(
      new TemplatePortal(this.userMenu, this.viewContainerRef, {
        $implicit: layout,
      })
    );

    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter((event) => {
          const clickTarget = event.target as HTMLElement;
          return (
            !!this.overlayRef &&
            !this.overlayRef.overlayElement.contains(clickTarget)
          );
        }),
        take(1)
      )
      .subscribe({});
  }

  openDeleteModal(clickEvent: any, layout: Categories) {
    this.close();
    // clickEvent.preventDefault();
    // this.currentLayoutData.categoryName = layout.categoryName;
    // console.log(layout);

    // Calculate the center of the screen
    const centerX = 850;
    const centerY = 300;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: centerX, y: centerY })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    this.overlayRef.attach(
      new TemplatePortal(this.deleteMenu, this.viewContainerRef, {
        $implicit: layout,
      })
    );

    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter((event) => {
          const clickTarget = event.target as HTMLElement;
          return (
            !!this.overlayRef &&
            !this.overlayRef.overlayElement.contains(clickTarget)
          );
        }),
        take(1)
      )
      .subscribe({});
  }

  deleteLayout(layout: Categories) {
    //remove category from categories
    let id = layout.id;
    this.categories = this.categories.filter((x) => x.id !== id);

    //Before removing category, push existing fields into fields table
    let fieldsToPush = this.layoutArray.filter(
      (field) => field.categoryId === id
    );
    fieldsToPush.forEach((object) => {
      if (object.isField) {
        this.updateFields(object.fields.objectId, object.fields.id);
      }
    });

    //remove all all connected fields from layout array
    this.layoutArray = this.layoutArray.filter(
      (field) => field.categoryId !== id
    );

    // Remove the layout's elementRef from its parent
    const elementRef = layout.elementRef;
    const parentElement = elementRef.parentElement;

    if (parentElement) {
      parentElement.removeChild(elementRef);
    }
    this.close();
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
    const elementId = document.getElementById('card-title-' + id);
    if (elementId) {
      elementId.innerHTML = layoutName;
      const l = this.getLayouts(id);
      l.categoryName = layoutName;
      currentLayoutData.LayoutName = '';
      this.updateLayouts(l, id);
      this.close();
    }
  }

  addObjectList() {
    this.showObjectListPanel = true;

    let id = Guid.create().toString();

    const createLayoutDiv = document.createElement('div');
    createLayoutDiv.className = 'col-xl-12 card ';
    createLayoutDiv.style.height = 'max-content';

    //pushing object list in layoutArray
    let objectList: ObjectList = {
      id: id,
      elementRef: createLayoutDiv,
      isObjectList: true,
      object: {},
      view: {},
      linkPointToPopup: false,
      friendlyName: ''
    };
    //this.currentObjectList = objectList;
    this.layoutArray.push(objectList);
    createLayoutDiv.onclick = () => this.initializeObjectListForm(id);
    this.initializeObjectListForm(id);

    //First Row
    const firstRow = document.createElement('div');
    firstRow.className = 'col-xl-12 card p-1 ';
    firstRow.style.height = '50px';
    createLayoutDiv.appendChild(firstRow);
    //Object Row
    const objectRow = document.createElement('div');
    objectRow.className = ' card  ';
    objectRow.style.height = '50px';
    objectRow.style.width = 'max-content';
    const head = document.createElement('div');
    head.className = 'd-flex flex-row justify-content-between p-2 mb-1';

    const objectTitle = document.createElement('div');
    objectTitle.className = 'm-2';
    head.innerHTML = 'Select Object';
    head.appendChild(objectTitle);

    const deleteButton = document.createElement('div');
    deleteButton.className = 'mb-2'
    new dxButton(deleteButton, {
      icon: 'close',
      onClick: (event) => this.deleteObjectList(event, objectList),
      type: 'normal',
      stylingMode: 'outlined',
    });
    head.appendChild(deleteButton);
    objectRow.appendChild(head);
    firstRow.appendChild(objectRow);

    // Second Row
    const secondRow = document.createElement('div');
    secondRow.className = 'col-xl-12 card p-1';
    secondRow.style.height = '50px';
    createLayoutDiv.appendChild(secondRow);

    // Third Row
    const thirdRow = document.createElement('div');
    thirdRow.className = 'col-xl-12  card p-1';
    thirdRow.style.height = '50px';
    createLayoutDiv.appendChild(thirdRow);

    // Fourth Row
    const fourthRow = document.createElement('div');
    fourthRow.className = 'col-xl-12  card p-1';
    fourthRow.style.height = '50px';
    createLayoutDiv.appendChild(fourthRow);

    this.componentBody.nativeElement.appendChild(createLayoutDiv);



  }

  initializeObjectListForm(id: string) {
    //this.ObjectListForm.reset();
    this.showObjectListPanel = true;
    let filteredObjectList = this.layoutArray.filter(x => x.id === id);
    this.currentObjectList = filteredObjectList[0];
    //this.ObjectListForm.patchValue(this.currentObjectList);
    //this.ObjectListForm.setValue(filteredObjectList[0]);
    if (filteredObjectList) {
      this.ObjectListForm.setValue({
        id: filteredObjectList[0].id,
        elementRef: filteredObjectList[0].elementRef,
        isObjectList: filteredObjectList[0].isObjectList,
        object: filteredObjectList[0].object,
        view: filteredObjectList[0].view,
        linkPointToPopup: filteredObjectList[0].linkPointToPopup,
        friendlyName: filteredObjectList[0].friendlyName // Make sure to set the value for 'friendlyName'
      });
    }
    console.log(this.ObjectListForm.value);
  }

  setObjectValues() {
    let currentList = this.layoutArray.filter(x => x.id === this.currentObjectList.id);
    currentList[0].id = this.ObjectListForm.get('id')?.value;
    currentList[0].elementRef = this.ObjectListForm.get('elementRef')?.value;
    currentList[0].isObjectList = this.ObjectListForm.get('isObjectList')?.value;
    currentList[0].object = this.ObjectListForm.get('object')?.value;
    currentList[0].view = this.ObjectListForm.get('view')?.value;
    currentList[0].linkPointToPopup = this.ObjectListForm.get('linkPointToPopup')?.value;
    currentList[0].friendlyName = this.ObjectListForm.get('friendlyName')?.value;

    //this.currentObjectList = currentList[0];
    this.layoutArray.forEach(element => {
      if (element.id === currentList[0].id) {
        element = currentList[0];
      }
    });
    debugger;
    if (this.ObjectListForm.get('object')?.value.display || this.ObjectListForm.get('friendlyName')?.value) {
      this.ChangeObjectDisplayName(currentList[0]);
    }
    console.log(this.ObjectListForm.value);
  }

  ChangeObjectDisplayName(objectList: any) {
    const objectRow = document.createElement('div');
    objectRow.className = ' card  ';
    objectRow.style.height = '50px';
    objectRow.style.width = 'max-content';
    const head = document.createElement('div');
    head.className = 'd-flex flex-row justify-content-between p-2 mb-1';

    const objectTitle = document.createElement('div');
    objectTitle.className = 'm-2';
    if (objectList.friendlyName || objectList.object.display) {
      head.innerHTML = (objectList.friendlyName) ? objectList.friendlyName : objectList.object.display;
     } else {
      head.innerHTML = 'Select Object 1';
    }
    
    head.appendChild(objectTitle);

    const deleteButton = document.createElement('div');
    deleteButton.className = 'mb-2'
    new dxButton(deleteButton, {
      icon: 'close',
      onClick: (event) => this.deleteObjectList(event, objectList[0]),
      type: 'normal',
      stylingMode: 'outlined',
    });
    head.appendChild(deleteButton);
    objectRow.appendChild(head);

    this.currentObjectList.elementRef.firstChild?.removeChild(this.currentObjectList.elementRef.firstChild.childNodes[0]);
    this.currentObjectList.elementRef.firstChild?.appendChild(objectRow);
  }

  deleteObjectList(event: any, objectList: ObjectList) {
    //remove all all connected fields from layout array
    this.layoutArray = this.layoutArray.filter(
      (objectlist) => objectlist.id !== objectList.id
    );

    // Remove the layout's elementRef from its parent
    const elementRef = objectList.elementRef;
    const parentElement = elementRef?.parentElement;

    if (parentElement) {
      parentElement.removeChild(elementRef);
    }
  }
















}
