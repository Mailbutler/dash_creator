class CreateDashCreatorFilters < ActiveRecord::Migration[5.1]
  def self.up
    if extension_enabled?('pgcrypto')
      create_table :dash_creator_filters, id: :uuid, default: 'gen_random_uuid()' do |t|
        t.string :name
        t.jsonb :options, default: {}
        t.uuid :user_id

        t.timestamps
      end

    else
      create_table :dash_creator_filters do |t|
        t.string :name
        t.jsonb :options, default: {}
        t.id :user_id

        t.timestamps
      end
    end
  end

  def self.down
    drop_table :dash_creator_filters
  end
end
