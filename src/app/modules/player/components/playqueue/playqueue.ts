import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit} from '@angular/core';
import {UserAnalyticsService} from '../../../user-analytics/services/user-analytics.service';
import {PlayQueue} from '../../collections/play-queue';
import {PlayQueueItem} from '../../models/play-queue-item';
import {ImageSizes} from '../../../shared/src/image-sizes.enum';
import {DragAndDropService, DragAndDropStates, IDragAndDropData} from '../../../shared/services/drag-and-drop';
import {Subscription} from 'rxjs/Subscription';
import {debounce} from 'underscore';

@Component({
  selector: 'app-play-queue',
  styleUrls: ['./playqueue.scss'],
  templateUrl: './playqueue.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayQueueComponent implements OnInit {
  private _subscriptions: Subscription;
  private _debouncedUpdate: Function;
  public coverSize = ImageSizes.Medium;
  public showDragAndDropHelp = false;

  @Input()
  public playQueue: PlayQueue<PlayQueueItem>;

  constructor(private el: ElementRef,
              private userAnalyticsService: UserAnalyticsService,
              private dragAndDropService: DragAndDropService,
              private cdr: ChangeDetectorRef) {
    this._subscriptions = new Subscription();
    this._debouncedUpdate = debounce(this.update, 10);
  }

  public drop(dragAndDrop: IDragAndDropData) {
    this.userAnalyticsService.trackEvent(
      'drag_and_drop',
      'playqueue-add',
      'app-play-queue'
    );
    if (this.playQueue.length > 0) {
      this.playQueue.queue({track: dragAndDrop.dragData});
    } else {
      this.playQueue.addAndPlay({track: dragAndDrop.dragData});
    }
  }

  private onDragStart() {
    this.el.nativeElement.classList.add('drag-in-progress');
    this.showDragAndDropHelp = true;
    this._debouncedUpdate();
  }

  private onDragEnd() {
    this.el.nativeElement.classList.remove('drag-in-progress');
    this.showDragAndDropHelp = false;
    this._debouncedUpdate();
  }

  private update() {
    this.cdr.detectChanges();
  }

  public toggleShuffle() {
    if (this.playQueue.isShuffled()) {
      this.playQueue.deShuffle();
    } else {
      this.playQueue.shuffle();
    }
  }

  public toggleLoop() {
    if (this.playQueue.isLooped()) {
      this.playQueue.setLoopPlayQueue(false);
    } else {
      this.playQueue.setLoopPlayQueue(true);
    }
  }

  public removeQueuedItems() {
    this.playQueue.getQueuedItems().forEach((item) => {
      this.playQueue.remove(item);
    });
  }

  public removeScheduledItems() {
    this.playQueue.getScheduledItems().forEach((item) => {
      this.playQueue.remove(item);
    });
  }

  public hasScheduledItems() {
    return (
      this.playQueue.getScheduledItems().length > 0 ||
      (this.playQueue.isLooped() && this.playQueue.getStoppedItems().length > 0)
    );
  }

  ngOnInit() {
    this._subscriptions.add(
      this.dragAndDropService
        .getObservable()
        .subscribe(ev => {
          if (ev === DragAndDropStates.DragStart) {
            this.onDragStart();
          } else {
            this.onDragEnd();
          }
        })
    );
    this.playQueue.on('add remove reset change:status change:track change:shuffle change:loop', this._debouncedUpdate, this);
  }
}
