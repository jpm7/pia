import { Router, ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { Measure } from './measures/measure.model';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map'

import { Evaluation } from 'app/entry/entry-content/evaluations/evaluation.model';
import { Answer } from 'app/entry/entry-content/questions/answer.model';

import { MeasureService } from 'app/entry/entry-content/measures/measures.service';
import { ModalsService } from 'app/modals/modals.service';
import { PiaService } from 'app/entry/pia.service';

@Component({
  selector: 'app-entry-content',
  templateUrl: './entry-content.component.html',
  styleUrls: ['./entry-content.component.scss'],
  providers: [PiaService]
})
export class EntryContentComponent implements OnInit, OnChanges {

  @Input() measureName: string;
  @Input() measurePlaceholder: string;
  @Input() section: { id: number, title: string, display_mode: string, short_help: string, items: any };
  @Input() item: { id: number, title: string, evaluation_mode: string, short_help: string, questions: any };
  @Input() questions: any;
  answers: Answer[] = [];

  constructor(private router: Router,
              private activatedRoute: ActivatedRoute,
              private _measureService: MeasureService,
              private _modalsService: ModalsService,
              private _piaService: PiaService) {
  }

  ngOnInit() {
    const measuresModel = new Measure();
    const answersModel = new Answer();
    this._piaService.getPIA().then((entry) => {
      measuresModel.pia_id = this._piaService.pia.id;
      measuresModel.findAll().then((entries: any[]) => {
        this._measureService.measures = entries;
        if (this._measureService.measures.length === 0) {
          this._measureService.addNewMeasure(this._piaService.pia);
        }
        /*
          TODO : display the 'declare measures' modal when there is only one measure and it is empty.
          It should be applied only on RISK other subsections.

          Check if there is only one measure :
          if (this._measureService.measures && parseInt(this._measureService.measures.length, 10) === 1) {
            Check if this only measure is empty :
            if (_measureService.measures[0].content == 'undefined' && _measureService.measures[0].title == 'undefined') {
            Then open the modal if section = 3 ET item != 1 (pas sur la page des mesures) :
              if () {
                this._modalsService.openModal('pia-declare-measures');
              }
            }
          }
        */
      });

      // For measures
      if (this.section.id === 3 && this.item.id === 1) {
        measuresModel.findAll().then((entries: any[]) => {
          const measures = entries;
          measures.forEach(element => {
            this.answers.push(element.id);
          });
        });
      } else {
        // For questions
        const questionsIds = [];
        this.questions.forEach(element => {
          questionsIds.push(element.id);
        });
        answersModel.findAllByPia(this._piaService.pia.id).then((entries: any) => {
          this.answers = entries.filter((item) => {
            return questionsIds.indexOf(item.reference_to) >= 0;
          });
        });
      }
    });
  }

  TODO() {
    const measuresModel = new Measure();
    const answersModel = new Answer();
    this._piaService.getPIA().then((entry) => {
      measuresModel.pia_id = this._piaService.pia.id;
      /* TODO : find measures where PIA id = this._piaService.pia_id */
      measuresModel.findAll().then((entries: any[]) => {
        this._measureService.measures = entries;
        if (this._measureService.measures.length === 0) {
          this._measureService.addNewMeasure(this._piaService.pia);
        } else {
          // Filling answers with measures if there are somes
          this._measureService.measures.forEach(element => {
            this.answers.push(element.id);
          });
        }
        /*
          TODO : display the 'declare measures' modal when there is only one measure and it is empty.
          It should be applied only on RISK other subsections.

          Check if there is only one measure :
          if (this._measureService.measures && parseInt(this._measureService.measures.length, 10) === 1) {
            Check if this only measure is empty :
            if (_measureService.measures[0].content == 'undefined' && _measureService.measures[0].title == 'undefined') {
            Then open the modal if section = 3 ET item != 1 (pas sur la page des mesures) :
              if () {
                this._modalsService.openModal('pia-declare-measures');
              }
            }
          }
        */
      });

      // Filling answers with questions if there are somes
      if (this.section.id !== 3 && this.item.id !== 1) {
        const questionsIds = [];
        this.questions.forEach(element => {
          questionsIds.push(element.id);
        });
        answersModel.findAllByPia(this._piaService.pia.id).then((entries: any) => {
          this.answers = entries.filter((item) => {
            return questionsIds.indexOf(item.reference_to) >= 0;
          });
        });
      }
    });
  }

  ngOnChanges() {
    if (this.measureName) {
      this._measureService.addNewMeasure(this._piaService.pia, this.measureName, this.measurePlaceholder);
    }
  }

  /**
   * Allows an user to ask an evaluation for a section.
   */
  /* TODO : don't allow user to click this button after it has been already clicked. (ngIf in view html ?) */
  askForEvaluation() {
    // Creates evaluations according to evaluation_mode
    if (this.item.evaluation_mode === 'item') {
      const evaluation = new Evaluation();
      evaluation.pia_id = this._piaService.pia.id;
      evaluation.reference_to = this.section.id + '.' + this.item.id;
      evaluation.create();
    } else {
      // Measures evaluations creation (n measures = n answers = n evaluations)
      if (this.section.id === 3 && this.item.id === 1) {
        for (let i = 0; i < this._measureService.measures.length; i++) {
          const evaluation = new Evaluation();
          evaluation.pia_id = this._piaService.pia.id;
          evaluation.reference_to = this.section.id + '.' + this.item.id + '.' + this._measureService.measures[i].id;
          evaluation.create();
        }
      } else {
        // Questions evaluations creation (n questions = n questions answers = n evaluations)
        for (let i = 0; i < this.questions.length; i++) {
          const evaluation = new Evaluation();
          evaluation.pia_id = this._piaService.pia.id;
          evaluation.reference_to = this.answers[i].reference_to;
          evaluation.create();
        }
      }
    }

    this._modalsService.openModal('ask-for-evaluation');

    /* TODO : update PIA status + 'refresh PIA' so that it changes header status icon + navigation status icons */
  }

  /**
   * Allows an user to validate evaluation for a section.
   */
  validateEvaluation() {
    this._modalsService.openModal('validate-evaluation');
    /* TODO : update PIA status + 'refresh PIA' so that it changes header status icon + navigation status icons */
    /* It should also locks PIA updates for THIS section */
  }

}
