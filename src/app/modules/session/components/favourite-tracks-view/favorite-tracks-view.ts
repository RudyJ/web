import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthenticatedUserModel} from '../../../api/authenticated-user/authenticated-user.model';
import {IAuthenticatedUserAccount} from '../../../api/authenticated-user/account/authenticated-user-account.interface';
import {AuthenticatedUserAccountsCollection} from '../../../api/authenticated-user/account/authenticated-user-accounts.collection';
import {TabPaneComponent} from '../../../shared/components/tab-pane/tab-pane';
import {ITrack} from '../../../api/tracks/track.interface';
import {IPlaylistItems} from '../../../api/playlists/playlist-item/playlist-items.interface';
import {IPlaylistItem} from '../../../api/playlists/playlist-item/playlist-item.interface';
import {IFavouriteTrackItems} from '../../../api/favourite-tracks/favourite-track-item/favourite-track-items.interface';
import {IFavouriteTrackItem} from '../../../api/favourite-tracks/favourite-track-item/favourite-track-item.interface';
import {ProviderMap} from '../../../shared/src/provider-map.class';

@Component({
  selector: 'app-favourite-tracks-view',
  styleUrls: ['./favorite-tracks-view.scss'],
  templateUrl: './favourite-tracks-view.html'
})

export class FavouriteTracksViewComponent implements OnInit, OnDestroy {
  private _selectedAccount: IAuthenticatedUserAccount;
  public availableProviderMap = ProviderMap.map;
  public accounts: AuthenticatedUserAccountsCollection<IAuthenticatedUserAccount>;
  public tracks: Array<ITrack>;

  constructor() {
    this.accounts = AuthenticatedUserModel.getInstance().accounts;
  }

  private setTracks(items: IFavouriteTrackItems<IFavouriteTrackItem>) {
    this.tracks = items.pluck('track');
  }

  private addSetTracksListener() {
    this._selectedAccount.favouriteTracks.items.on(
      'update reset',
      this.setTracks,
      this
    );
  }

  private removeSetTracksListener() {
    this.accounts.forEach((accountForProvider) => {
      accountForProvider.favouriteTracks.items.off(
        'update reset',
        this.setTracks,
        this
      );
    });
  }

  public selectTab(tabPane: TabPaneComponent) {
    this._selectedAccount = this.accounts.getAccountForProvider(tabPane.id);

    this.removeSetTracksListener();
    this.addSetTracksListener();

    if (this._selectedAccount && this._selectedAccount.favouriteTracks.items.length === 0) {
      this._selectedAccount.favouriteTracks.items.fetch();
    }

    this.setTracks(this._selectedAccount.favouriteTracks.items);
  }

  public deleteTrack(track: ITrack) {
    if (this._selectedAccount) {
      const favItems = this._selectedAccount.favouriteTracks.items.filter((item: IFavouriteTrackItem) => {
        return item.track === track;
      });
      favItems.forEach((favItem) => {
        favItem.destroy();
      });
    }
  }

  ngOnInit(): void {
    this._selectedAccount = this.accounts.getAccountForProvider('cloudplayer');
    this.addSetTracksListener();
  }

  ngOnDestroy(): void {
    this.removeSetTracksListener();
  }
}
