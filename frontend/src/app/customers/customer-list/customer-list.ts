import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CustomerService } from '../../core/services/customer';
import { DatasetService } from '../../core/services/dataset';
import { ToastService } from '../../core/services/toast';
@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.css']
})
export class CustomerListComponent implements OnInit {

  // ================= DATA =================

  previewData: any[] = [];
  displayData: any[] = [];
  emailPattern = /^[^\s@]+@[^\s@]+$/;
  phonePattern = /^[0-9]{10}$/;
  toastType: 'success' | 'error' = 'success';

  datasets: any[] = [];
  selectedDataset: any = null;
  selectedFile: File | null = null;
  selectedFileName: string = '';

  editingRow: any = null;

  // ================= NEW UI STATES =================
  isEditing = false;
  formError = '';
  toastMessage = '';
  showToast = false;

  // ================= UNDO =================

  undoRow: any = null;
  undoAction: string = '';
  undoIndex: number = -1;
  undoInterval: any = null;
  undoSeconds = 0;

  // ================= DATASET =================

  datasetNameInput = '';
  loadedDatasetName = '';
  editIdInput = '';
  datasetToDelete: any = null;


  // ================= UI =================

  showTable = false;
  showSavePopup = false;
  showEditPopup = false;
  showActionPopup = false;
  showDeleteConfirm = false;
  showDeleteDatasetConfirm = false;
  showMergePopup = false;
  isPersistedDataset = false;

  // ================= PAGINATION =================

  page = 1;
  pageSize = 50;
  sortDirection = 1;

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private customerService: CustomerService,
    private datasetService: DatasetService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadUserDatasets();      // keep original
    this.fetchDatasetsFromCloud(); // cloud refresh
  }

  // ================= TOAST SYSTEM =================

  showToastMessage(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  // ================= FILE SELECT =================

  onFileSelect(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  // ================= IMPORT =================

  importDataset() {

    if (!this.selectedFile) {
      this.showToastMessage('Select a file first');
      return;
    }

    this.isPersistedDataset = false;
    this.loadedDatasetName = '';
    this.selectedDataset = null;
    this.datasetNameInput = '';

    const file = this.selectedFile;
    const reader = new FileReader();
    const ext = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (e: any) => {

      let raw: any[] = [];
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsedRaw: any[] = XLSX.utils.sheet_to_json(sheet);

      raw = parsedRaw.map(row => {
        const newRow: any = {};
        for (let key in row) {
          if (key && typeof key === 'string' && key.trim()) {
            newRow[key.trim().toLowerCase()] = row[key];
          } else {
            newRow[key] = row[key];
          }
        }
        return newRow;
      });

      if (!this.validateDataset(raw)) {
        this.previewData = [];
        return;
      }

      this.previewData = raw;

      this.page = 1;
      this.updatePageBuffer();
      this.showTable = true;
      this.cd.detectChanges();

      this.showToastMessage(`Imported ${this.previewData.length} records`);
    };

    reader.readAsArrayBuffer(file);
  }

  // ================= PAGINATION =================

  updatePageBuffer() {
    const start = (this.page - 1) * this.pageSize;
    this.displayData = this.previewData.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.page * this.pageSize < this.previewData.length) {
      this.page++;
      this.updatePageBuffer();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePageBuffer();
    }
  }

  // ================= SORT =================

  sortBy(field: string) {
    this.previewData.sort((a: any, b: any) => {
      if (a[field] > b[field]) return this.sortDirection;
      if (a[field] < b[field]) return -this.sortDirection;
      return 0;
    });

    this.sortDirection *= -1;
    this.updatePageBuffer();
  }

  // ================= EXPORT =================

  exportCSV() {
    if (!this.previewData.length) return;

    const ws = XLSX.utils.json_to_sheet(this.previewData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'customers.csv');
  }

  exportExcel() {
    if (!this.previewData.length) return;

    const ws = XLSX.utils.json_to_sheet(this.previewData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'customers.xlsx');
  }

  // ================= EDIT FLOW =================

  editRow(id: number) {

    if (!this.isPersistedDataset) {
      this.showToastMessage(
        "Please save the dataset before editing."
      );
      return;
    }

    this.editIdInput = id.toString();
    this.confirmEditId();
  }

  confirmEditId() {
    const targetId = Number(this.editIdInput);

    // Find row by explicit id OR by implicit array index (since UI says ID is index + 1)
    const row = this.previewData.find((r, index) => (r.id || index + 1) === targetId);

    if (!row) {
      this.showToastMessage('Invalid ID');
      return;
    }

    // Attach local ID if it didn't exist so saveChanges() can map it back
    this.editingRow = { ...row, id: row.id || targetId };
    this.showActionPopup = true;
    this.showEditPopup = false;
  }

  changeInfo() {
    this.formError = '';
    this.isEditing = true;
  }

  saveChanges() {

    if (!this.editingRow) return;

    if (!this.editingRow.name?.trim()) {
      this.formError = 'Name is required';
      return;
    }

    if (!this.editingRow.email?.trim()) {
      this.formError = 'Email is required';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+$/;

    if (!emailPattern.test(this.editingRow.email)) {
      this.formError = 'Invalid email format';
      return;
    }

    if (!this.editingRow.phone?.toString().match(this.phonePattern)) {
      this.formError = 'Phone must be exactly 10 digits';
      return;
    }

    const index = this.previewData.findIndex(
      (r, i) => (r.id || i + 1) === this.editingRow.id
    );

    if (index === -1) return;

    this.pushUndo(this.previewData[index], 'edit', index);

    // Update locally
    this.previewData[index] = this.editingRow;
    this.previewData = [...this.previewData];
    this.updatePageBuffer();

    this.showToastMessage('Customer updated successfully');
    this.closePopup();

    // Persist if it's a cloud dataset
    this.syncToCloud();
  }

  closePopup() {
    this.showActionPopup = false;
    this.isEditing = false;
    this.showEditPopup = false;
  }

  confirmDelete() {
    this.showActionPopup = false;
    this.showDeleteConfirm = true;
  }

  deleteRow() {

    this.pushUndo(this.editingRow, 'delete', this.previewData.findIndex((r, i) => (r.id || i + 1) === this.editingRow.id));

    this.previewData =
      this.previewData.filter((r, i) => (r.id || i + 1) !== this.editingRow.id);

    this.reassignIds();
    this.updatePageBuffer();

    this.showDeleteConfirm = false;

    this.showToastMessage('Customer deleted');
    this.syncToCloud();
  }

  // ================= UNDO =================

  pushUndo(row: any, action: string = 'delete', overrideIndex: number = -1) {

    this.undoRow = JSON.parse(JSON.stringify(row));
    this.undoAction = action;
    this.undoIndex = overrideIndex !== -1 ? overrideIndex : this.previewData.findIndex((r, i) => (r.id || i + 1) === (row.id || row._id));

    this.undoSeconds = 15; // Set to 15 seconds instead of 60 for better UX
    clearInterval(this.undoInterval);

    this.undoInterval = setInterval(() => {

      this.undoSeconds--;

      if (this.undoSeconds <= 0) {
        clearInterval(this.undoInterval);
        this.undoRow = null;
        this.undoSeconds = 0;
        this.undoAction = '';
        this.undoIndex = -1;
      }

    }, 1000);
  }

  undoDelete() {

    if (!this.undoRow) return;

    if (this.undoAction === 'edit') {
      if (this.undoIndex !== -1) {
        this.previewData[this.undoIndex] = this.undoRow;
      }
    } else {
      if (this.undoIndex !== -1) {
        this.previewData.splice(this.undoIndex, 0, this.undoRow);
      } else {
        this.previewData.push(this.undoRow); // fallback
      }
      this.reassignIds();
    }

    this.previewData = [...this.previewData];
    this.updatePageBuffer();

    this.undoRow = null;
    this.undoAction = '';
    this.undoIndex = -1;

    clearInterval(this.undoInterval);
    this.syncToCloud();
  }

  reassignIds() {
    this.previewData.forEach((r, i) => {
      r.id = i + 1;
    });
  }

  // ================= CLOUD SYNC =================
  syncToCloud() {
    if (this.isPersistedDataset && this.selectedDataset?._id) {
      const token = localStorage.getItem('token') || '';
      this.datasetService.updateDataset(this.selectedDataset._id, { customers: this.previewData }, token).subscribe({
        next: () => { console.log('Cloud dataset synced silently'); },
        error: (err: any) => { console.error('Cloud dataset sync error', err); }
      });
    }
  }

  // ================= DATASET SAVE =================

  syncDatasetManually() {
    if (this.isPersistedDataset && this.selectedDataset) {
      this.syncToCloud();
      this.showToastMessage('Dataset synced successfully!');
    }
  }

  saveDataset() {

    if (!this.previewData.length) {
      this.showToastMessage('No data to save');
      return;
    }

    const token = localStorage.getItem('token') || '';

    const defaultName = this.selectedFileName
      ? this.selectedFileName.replace(/\.(csv|xlsx|xls)$/i, '')
      : `dataset_${Date.now()}`;
    const datasetName = this.datasetNameInput.trim() || defaultName;

    // 🔥 Prevent duplicate dataset NAME
    if (this.datasets.some(d => d.name === datasetName)) {
      this.showToastMessage("Dataset name already exists");
      return;
    }

    // 🔥 Prevent identical dataset CONTENT
    const isDuplicateContent = this.datasets.some(d =>
      JSON.stringify(d.customers) === JSON.stringify(this.previewData)
    );

    if (isDuplicateContent) {
      this.showToastMessage("Duplicate dataset not allowed");
      return;
    }

    const dataset = {
      name: datasetName,
      customers: this.previewData
    };

    this.datasetService.saveDataset(dataset, token)
      .subscribe({
        next: () => {
          this.showToastMessage('Dataset saved to cloud');
          this.isPersistedDataset = true;
          this.loadedDatasetName = datasetName; // 🔥 FIXED
          this.showSavePopup = false;
          this.datasetNameInput = '';

          // refresh datasets list
          this.fetchDatasetsFromCloud();
          this.cd.detectChanges();
        },
        error: (err: any) => {
          console.error("Dataset save error:", err);
          if (err.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            this.router.navigate(['/login']);
            this.showToastMessage('Session expired. Please log in again.');
            return;
          }
          this.showToastMessage(err.error?.message || 'Dataset save failed');
        }
      });
  }

  fetchDatasetsFromCloud() {

    const token = localStorage.getItem('token') || '';
    const username = localStorage.getItem('username') || 'guest';

    this.datasetService.getDatasets(token)
      .subscribe({
        next: (res: any) => {
          console.log("Fetched datasets response:", res);
          let newDatasets = res.datasets ? res.datasets : res;

          // Ensure it's an array
          if (!Array.isArray(newDatasets)) {
            newDatasets = [];
          }

          this.datasets = newDatasets;

          // Sync to localStorage for other components (like Campaigns)
          localStorage.setItem(`datasets_${username}`, JSON.stringify(this.datasets));
          this.cd.detectChanges();
        },
        error: (err: any) => {
          if (err.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            this.router.navigate(['/login']);
            this.showToastMessage('Session expired. Please log in again.');
          } else {
            this.showToastMessage('Failed to load datasets');
          }
        }
      });
  }


  // ================= LOAD USER DATASETS =================

  loadUserDatasets() {

    const username =
      localStorage.getItem('username') || 'guest';

    const saved =
      localStorage.getItem(`datasets_${username}`);

    this.datasets =
      saved ? JSON.parse(saved) : [];
  }

  // ================= SELECT DATASET =================

  selectDataset(d: any) {

    this.selectedDataset = d;

    this.previewData = [...d.customers];

    this.page = 1;
    this.updatePageBuffer();

    this.showTable = true;

    this.isPersistedDataset = true;
  }

  // ================= USE FOR CAMPAIGN =================

  useForCampaign(dataset: any) {

    if (!dataset) {
      this.showToastMessage('Select a dataset first');
      return;
    }

    this.router.navigate(['/campaigns-form'], {
      state: { dataset }
    });
  }

  // ================= DELETE DATASET =================

  deleteEntireDatasetPrompt() {

    if (this.selectedDataset) {
      this.datasetToDelete = this.selectedDataset;
    }
    else if (this.previewData.length > 0) {
      this.datasetToDelete = {
        name: "Imported Dataset",
        imported: true
      };
    }
    else {
      this.showToastMessage("No dataset loaded");
      return;
    }

    this.showDeleteDatasetConfirm = true;
  }

  confirmDatasetDelete() {

    const username = localStorage.getItem('username') || 'guest';
    const token = localStorage.getItem('token') || '';

    if (!this.datasetToDelete.imported) {

      // Remove logically from local array
      this.datasets = this.datasets.filter(d => d !== this.datasetToDelete);
      localStorage.setItem(`datasets_${username}`, JSON.stringify(this.datasets));

      // 🔴 Actually delete from backend cloud!
      if (this.datasetToDelete._id) {
        this.datasetService.deleteDataset(this.datasetToDelete._id, token).subscribe({
          next: () => {
            this.fetchDatasetsFromCloud(); // Refresh list to match reality
          },
          error: (err: any) => {
            console.error("Cloud delete error:", err);
            this.showToastMessage("Failed to delete dataset on server.");
          }
        });
      }
    }

    this.previewData = [];
    this.selectedDataset = null;
    this.loadedDatasetName = '';
    this.isPersistedDataset = false;

    this.loadUserDatasets();

    this.showDeleteDatasetConfirm = false;
    this.datasetToDelete = null;

    this.showToastMessage("Dataset deleted");
  }
  openEditPopup() {

    if (!this.isPersistedDataset) {
      this.showToastMessage(
        "Please save the dataset before editing."
      );
      return;
    }

    this.editIdInput = '';
    this.showEditPopup = true;
  }

  private validateDataset(data: any[]): boolean {

    const requiredColumns = ['name', 'email', 'phone'];

    // Check required columns exist
    const firstRow = data[0];
    for (let col of requiredColumns) {
      if (!(col in firstRow)) {
        this.showToastMessage(`Invalid dataset: Missing column "${col}"`);
        return false;
      }
    }

    for (let row of data) {

      if (!row.name?.trim()) {
        this.showToastMessage("Invalid dataset: Name missing");
        return false;
      }

      if (!row.email?.trim()) {
        this.showToastMessage("Invalid dataset: Email missing");
        return false;
      }

      if (!this.emailPattern.test(row.email)) {
        this.showToastMessage("Invalid dataset: Invalid email format");
        return false;
      }

      if (!row.phone?.toString().match(/^[0-9]{10}$/)) {
        this.showToastMessage("Invalid dataset: Phone must be 10 digits");
        return false;
      }
    }

    return true;
  }

}